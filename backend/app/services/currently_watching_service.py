from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.models.currently_watching import CurrentlyWatching
from app.models.movie import Movie
from app.models.show import Show
from app.models.genre import MovieGenre, ShowGenre
from app.models.provider import MovieProvider, ShowProvider
from app.models.watchlist import Watchlist
from app.models.watched import Watched
from app.models.episode import Episode
from app.models.episode_watched import EpisodeWatched
from app.services.watchlist_service import (
    _upsert_genres,
    _upsert_providers,
    _upsert_seasons_for_show,
    get_theatrical_release_date,
)
from app.services.tmdb_movies import fetch_movie_from_tmdb
from app.services.tmdb_tv import fetch_show_from_tmdb
from app.services.episode_service import sync_show_episodes_background
from app.services.tvmaze_service import fetch_show_air_time


def _is_on_other_list(db: Session, user_id: str, content_type: str, content_id: int) -> bool:
    """Return True if the item exists on Watchlist or Watched."""
    return any(
        db.query(t).filter_by(user_id=user_id, content_type=content_type, content_id=content_id).first() is not None
        for t in (Watchlist, Watched)
    )


def _get_currently_watching_items(db: Session, user_id: str, content_type: str):
    # The currently-watching strip only needs basic card fields — no seasons,
    # genres, or providers — so skip the heavy selectinload options.
    if content_type == "tv":
        items = (
            db.query(Show)
            .select_from(CurrentlyWatching)
            .join(Show, and_(
                CurrentlyWatching.content_id == Show.id,
                CurrentlyWatching.content_type == "tv",
                CurrentlyWatching.user_id == user_id,
            ))
            .all()
        )
        return [
            {
                "id": s.id,
                "name": s.name,
                "poster_path": s.poster_path,
                "backdrop_path": s.backdrop_path,
                "air_time": s.air_time,
                "air_timezone": s.air_timezone,
                "vote_average": s.vote_average,
                "status": s.status,
                "in_production": s.in_production,
            }
            for s in items
        ]
    else:
        items = (
            db.query(Movie)
            .select_from(CurrentlyWatching)
            .join(Movie, and_(
                CurrentlyWatching.content_id == Movie.id,
                CurrentlyWatching.content_type == "movie",
                CurrentlyWatching.user_id == user_id,
            ))
            .all()
        )
        return [
            {
                "id": m.id,
                "title": m.title,
                "poster_path": m.poster_path,
                "backdrop_path": m.backdrop_path,
                "runtime": m.runtime,
                "release_date": m.release_date,
                "vote_average": m.vote_average,
                "status": m.status,
            }
            for m in items
        ]


def add_to_currently_watching(
    db: Session, user_id: str, content_type: str, content_id: int
):
    existing = (
        db.query(CurrentlyWatching)
        .filter_by(user_id=user_id, content_type=content_type, content_id=content_id)
        .first()
    )
    if existing:
        return existing

    already_tracked = _is_on_other_list(db, user_id, content_type, content_id)

    entry = CurrentlyWatching(
        user_id=user_id,
        content_type=content_type,
        content_id=content_id,
    )
    db.add(entry)

    if content_type == "movie":
        movie = db.query(Movie).filter_by(id=content_id).first()
        if not movie:
            movie_data = fetch_movie_from_tmdb(
                content_id, "watch/providers,release_dates,images"
            )
            if not movie_data or not movie_data.get("title"):
                raise ValueError("Cannot add movie without a title")
            us_providers = (
                movie_data.get("watch/providers", {}).get("results", {}).get("US", {})
            )
            theatrical_release_date = get_theatrical_release_date(movie_data)
            all_logos = movie_data.get("images", {}).get("logos", [])
            english_logos = [l for l in all_logos if l.get("iso_639_1") == "en"]
            logo = english_logos[0]["file_path"] if english_logos else None
            movie = Movie(
                id=movie_data["id"],
                imdb_id=movie_data.get("imdb_id"),
                backdrop_path=movie_data.get("backdrop_path"),
                budget=movie_data.get("budget"),
                homepage=movie_data.get("homepage"),
                tagline=movie_data.get("tagline"),
                poster_path=movie_data.get("poster_path"),
                overview=movie_data.get("overview"),
                release_date=theatrical_release_date,
                revenue=movie_data.get("revenue"),
                runtime=movie_data.get("runtime"),
                status=movie_data.get("status"),
                title=movie_data.get("title"),
                logo_path=logo,
                tracking_count=1,
                vote_average=movie_data.get("vote_average"),
            )
            db.add(movie)
            db.flush()
            _upsert_genres(db, movie_data.get("genres", []), MovieGenre, movie_id=movie.id)
            _upsert_providers(db, us_providers, MovieProvider, movie_id=movie.id)
        elif not already_tracked:
            movie.tracking_count += 1

    elif content_type == "tv":
        show = db.query(Show).filter_by(id=content_id).first()
        if not show:
            show_data = fetch_show_from_tmdb(content_id, "watch/providers,images")
            if not show_data or not show_data.get("name"):
                raise ValueError("Cannot add show without a name")
            us_providers = (
                show_data.get("watch/providers", {}).get("results", {}).get("US", {})
            )
            all_logos = show_data.get("images", {}).get("logos", [])
            english_logos = [l for l in all_logos if l.get("iso_639_1") == "en"]
            logo = english_logos[0]["file_path"] if english_logos else None
            air_time, air_timezone = fetch_show_air_time(show_data["name"])
            show = Show(
                id=show_data["id"],
                name=show_data["name"],
                backdrop_path=show_data.get("backdrop_path"),
                last_air_date=show_data.get("last_air_date"),
                homepage=show_data.get("homepage"),
                in_production=show_data.get("in_production"),
                number_of_seasons=show_data.get("number_of_seasons"),
                number_of_episodes=show_data.get("number_of_episodes"),
                status=show_data.get("status"),
                tagline=show_data.get("tagline"),
                overview=show_data.get("overview"),
                type=show_data.get("type"),
                first_air_date=show_data.get("first_air_date"),
                poster_path=show_data.get("poster_path"),
                logo_path=logo,
                tracking_count=1,
                air_time=air_time,
                air_timezone=air_timezone,
                vote_average=show_data.get("vote_average"),
            )
            db.add(show)
            db.flush()
            _upsert_genres(db, show_data.get("genres", []), ShowGenre, show_id=show.id)
            _upsert_providers(db, us_providers, ShowProvider, show_id=show.id)
            _upsert_seasons_for_show(db, show, show_data.get("seasons", []))
        elif not already_tracked:
            show.tracking_count += 1

    db.commit()
    db.refresh(entry)

    if content_type == "tv":
        sync_show_episodes_background(content_id)

    return entry


def remove_from_currently_watching(
    db: Session, user_id: str, content_type: str, content_id: int
):
    entry = (
        db.query(CurrentlyWatching)
        .filter_by(user_id=user_id, content_type=content_type, content_id=content_id)
        .first()
    )
    if not entry:
        return {"message": "Item not found in currently watching"}
    db.delete(entry)

    still_tracked = _is_on_other_list(db, user_id, content_type, content_id)

    if not still_tracked:
        if content_type == "movie":
            movie = db.query(Movie).filter_by(id=content_id).first()
            if movie:
                movie.tracking_count -= 1
                if movie.tracking_count <= 0:
                    db.delete(movie)
        elif content_type == "tv":
            show = db.query(Show).filter_by(id=content_id).first()
            if show:
                show.tracking_count -= 1
                if show.tracking_count <= 0:
                    db.query(EpisodeWatched).filter_by(show_id=content_id).delete()
                    db.query(Episode).filter_by(show_id=content_id).delete()
                    db.delete(show)

    db.commit()
    return {"message": "Removed from currently watching"}


def get_currently_watching(db: Session, user_id: str):
    return {
        "movies": _get_currently_watching_items(db, user_id, "movie"),
        "shows": _get_currently_watching_items(db, user_id, "tv"),
    }
