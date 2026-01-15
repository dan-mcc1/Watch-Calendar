# app/services/episode_watched_service.py
from sqlalchemy.orm import Session
from datetime import datetime
from app.models.episode_watched import EpisodeWatched


def add_episode_watched(
    db: Session,
    user_id: str,
    show_id: int,
    season_number: int,
    episode_number: int,
    rating: float = None,
):
    """
    Mark an episode as watched.
    """
    existing = (
        db.query(EpisodeWatched)
        .filter_by(
            user_id=user_id,
            show_id=show_id,
            season_number=season_number,
            episode_number=episode_number,
        )
        .first()
    )
    if existing:
        return existing

    entry = EpisodeWatched(
        user_id=user_id,
        show_id=show_id,
        season_number=season_number,
        episode_number=episode_number,
        watched_at=datetime.utcnow(),
        rating=rating,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def remove_episode_watched(
    db: Session,
    user_id: str,
    show_id: int,
    season_number: int,
    episode_number: int,
):
    """
    Remove an episode from watched list.
    """
    entry = (
        db.query(EpisodeWatched)
        .filter_by(
            user_id=user_id,
            show_id=show_id,
            season_number=season_number,
            episode_number=episode_number,
        )
        .first()
    )
    if entry:
        db.delete(entry)
        db.commit()
        return {"message": "Removed from watched episodes"}
    return {"message": "Episode not found in watched list"}


def get_watched_episodes(db: Session, user_id: str):
    """
    Get all watched episodes for a user.
    """
    items = db.query(EpisodeWatched).filter_by(user_id=user_id).all()
    return [
        {
            "show_id": item.show_id,
            "season_number": item.season_number,
            "episode_number": item.episode_number,
            "watched_at": item.watched_at.isoformat(),
            "rating": item.rating,
        }
        for item in items
    ]
