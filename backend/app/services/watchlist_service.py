# app/services/watchlist_service.py
from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime
from app.models.watchlist import Watchlist
from app.models.watched import Watched
from app.models.movie import Movie
from app.models.show import Show
from app.models.episode import Episode
from app.models.episode_watched import EpisodeWatched
from app.services.tmdb_movies import fetch_movie_from_tmdb
from app.services.tmdb_tv import fetch_show_from_tmdb
from app.services.episode_service import maybe_sync_show_episodes
from functools import lru_cache


def get_theatrical_release_date(movie_data: dict) -> str | None:
    results = movie_data.get("release_dates", {}).get("results", [])

    us_entry = next(
        (r for r in results if r.get("iso_3166_1") == "US"),
        None,
    )

    if not us_entry:
        return None

    # Prefer theatrical > limited > premiere
    for release_type in (3, 2, 1):
        for rd in us_entry.get("release_dates", []):
            if rd.get("type") == release_type:
                return rd.get("release_date")

    return None


def add_to_watchlist(db: Session, user_id: str, content_type: str, content_id: int):
    """
    Add a movie or show to the user's watchlist.
    """
    # Check if item already exists
    existing = (
        db.query(Watchlist)
        .filter_by(user_id=user_id, content_type=content_type, content_id=content_id)
        .first()
    )
    if existing:
        return existing

    entry = Watchlist(
        user_id=user_id,
        content_type=content_type,
        content_id=content_id,
        added_at=datetime.utcnow(),
    )
    db.add(entry)

    # Increment tracking_count in content table
    if content_type == "movie":
        movie = db.query(Movie).filter_by(id=content_id).first()
        if movie:
            movie.tracking_count += 1
        else:
            # Optional: fetch data from TMDb if needed
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
                genres=movie_data.get("genres"),
                homepage=movie_data.get("homepage"),
                tagline=movie_data.get("tagline"),
                poster_path=movie_data.get("poster_path"),
                overview=movie_data.get("overview"),
                release_date=theatrical_release_date,
                revenue=movie_data.get("revenue"),
                runtime=movie_data.get("runtime"),
                status=movie_data.get("status"),
                title=movie_data.get("title"),
                providers=us_providers,
                logo_path=logo,
                tracking_count=1,
            )
            db.add(movie)
    elif content_type == "tv":
        show = db.query(Show).filter_by(id=content_id).first()
        if show:
            show.tracking_count += 1
        else:
            show_data = fetch_show_from_tmdb(content_id, "watch/providers,images")
            if not show_data or not show_data.get("name"):
                raise ValueError("Cannot add show without a name")
            us_providers = (
                show_data.get("watch/providers", {}).get("results", {}).get("US", {})
            )
            all_logos = show_data.get("images", {}).get("logos", [])
            english_logos = [l for l in all_logos if l.get("iso_639_1") == "en"]
            logo = english_logos[0]["file_path"] if english_logos else None
            show = Show(
                id=show_data["id"],
                name=show_data["name"],  # required
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
                genres=show_data.get("genres"),
                seasons=show_data.get("seasons"),
                first_air_date=show_data.get("first_air_date"),
                poster_path=show_data.get("poster_path"),
                providers=us_providers,
                logo_path=logo,
                tracking_count=1,
            )
            db.add(show)

    db.commit()
    db.refresh(entry)

    # Sync all episodes into the episode table so they're available for tracking
    if content_type == "tv":
        maybe_sync_show_episodes(db, content_id)

    return entry


def remove_from_watchlist(
    db: Session, user_id: str, content_type: str, content_id: int
):
    """
    Remove a movie or show from the user's watchlist.
    """
    entry = (
        db.query(Watchlist)
        .filter_by(user_id=user_id, content_type=content_type, content_id=content_id)
        .first()
    )

    if not entry:
        return {"message": "Item not found in watchlist"}

    db.delete(entry)

    # Decrement tracking_count
    if content_type == "movie":
        movie = db.query(Movie).filter_by(id=content_id).first()
        if movie:
            movie.tracking_count -= 1
            watched_exists = (
                db.query(Watched)
                .filter_by(content_id=content_id, content_type="movie")
                .first()
            )

        if movie.tracking_count <= 0 and not watched_exists:
            db.delete(movie)
    elif content_type == "tv":
        show = db.query(Show).filter_by(id=content_id).first()
        if show:
            show.tracking_count -= 1
            watched_exists = (
                db.query(Watched)
                .filter_by(content_id=content_id, content_type="tv")
                .first()
            )

        if show.tracking_count <= 0 and not watched_exists:
            # Delete child rows first to satisfy FK constraints
            db.query(EpisodeWatched).filter_by(show_id=content_id).delete()
            db.query(Episode).filter_by(show_id=content_id).delete()
            db.delete(show)

    db.commit()
    return {"message": "Removed from watchlist"}


@lru_cache(maxsize=1024)
def get_watchlist(db: Session, user_id: str):
    """
    Get all movies and shows in a user's watchlist.
    """
    movies = get_movie_watchlist_info(db, user_id)
    shows = get_tv_watchlist_info(db, user_id)
    return {"movies": movies, "shows": shows}


@lru_cache(maxsize=1024)
def get_tv_watchlist_info(db: Session, user_id: str):
    """
    Get all watchlist shows and movies and all data about them
    """
    items = (
        db.query(Show)
        .select_from(Watchlist)
        .join(
            Show,
            and_(
                Watchlist.content_id == Show.id,
                Watchlist.content_type == "tv",
                Watchlist.user_id == user_id,
            ),
        )
        .all()
    )
    return [show for show in items]


@lru_cache(maxsize=1024)
def get_movie_watchlist_info(db: Session, user_id: str):
    """
    Get all watchlist shows and movies and all data about them
    """
    items = (
        db.query(Movie)
        .select_from(Watchlist)
        .join(
            Movie,
            and_(
                Watchlist.content_id == Movie.id,
                Watchlist.content_type == "movie",
                Watchlist.user_id == user_id,
            ),
        )
        .all()
    )
    return [movie for movie in items]


@lru_cache(maxsize=1024)
def get_movie_watchlist_status(id: int, db: Session, user_id: str):
    entry = (
        db.query(Watchlist)
        .filter_by(content_id=id, user_id=user_id, content_type="movie")
        .first()
    )

    if entry:
        return {"status": "Want To Watch"}

    entry = (
        db.query(Watched)
        .filter_by(content_id=id, user_id=user_id, content_type="movie")
        .first()
    )

    if entry:
        return {"status": "Watched"}

    return {"status": "none"}


@lru_cache(maxsize=1024)
def get_show_watchlist_status(id: int, db: Session, user_id: str):
    entry = (
        db.query(Watchlist)
        .filter_by(content_id=id, user_id=user_id, content_type="tv")
        .first()
    )

    if entry:
        return {"status": "Want To Watch"}

    entry = (
        db.query(Watched)
        .filter_by(content_id=id, user_id=user_id, content_type="tv")
        .first()
    )

    if entry:
        return {"status": "Watched"}

    return {"status": "none"}
