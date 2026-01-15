# app/services/movie_watched_service.py
from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime
from app.models.watched import Watched
from app.models.movie import Movie
from app.models.show import Show
from app.services.tmdb_tv import fetch_show_from_tmdb
from app.services.tmdb_movies import fetch_movie_from_tmdb
from app.services.watchlist_service import get_theatrical_release_date


def add_to_watched(
    db: Session, user_id: str, content_type: str, content_id: int, rating: float = None
):
    """
    Mark a movie as watched.
    """
    existing = (
        db.query(Watched)
        .filter_by(user_id=user_id, content_type=content_type, content_id=content_id)
        .first()
    )
    if existing:
        return existing

    entry = Watched(
        user_id=user_id,
        content_type=content_type,
        content_id=content_id,
        watched_at=datetime.utcnow(),
        rating=rating,
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
                logo_path=logo,
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
                logo_path=logo,
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
                tracking_count=1,
            )
            db.add(show)

    db.commit()
    db.refresh(entry)
    return entry


def remove_from_watched(db: Session, user_id: str, content_type: str, content_id: int):
    """
    Remove a movie from the watched list.
    """
    entry = (
        db.query(Watched)
        .filter_by(user_id=user_id, content_type=content_type, content_id=content_id)
        .first()
    )
    if entry:
        db.delete(entry)
        db.commit()
        return {"message": "Removed from watched"}
    return {"message": "Not found in watched list"}


def get_watched(db: Session, user_id: str):
    movies = get_watched_movies_info(db, user_id)
    shows = get_watched_tv_info(db, user_id)
    return {"movies": movies, "shows": shows}


def get_watched_movies_info(db: Session, user_id: str):
    """
    Get all watched movies for a user.
    """
    items = (
        db.query(Movie)
        .select_from(Watched)
        .join(
            Movie,
            and_(
                Watched.content_id == Movie.id,
                Watched.content_type == "movie",
                Watched.user_id == user_id,
            ),
        )
        .all()
    )
    return [show for show in items]


def get_watched_tv_info(db: Session, user_id: str):
    """
    Get all watched movies for a user.
    """
    items = (
        db.query(Show)
        .select_from(Watched)
        .join(
            Show,
            and_(
                Watched.content_id == Show.id,
                Watched.content_type == "tv",
                Watched.user_id == user_id,
            ),
        )
        .all()
    )
    return [show for show in items]
