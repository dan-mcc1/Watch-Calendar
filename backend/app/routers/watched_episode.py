# app/routers/episode_watched.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.watched_episode_service import (
    add_episode_watched,
    remove_episode_watched,
    get_watched_episodes,
)
from app.dependencies.auth import get_current_user

router = APIRouter()


# Add an episode as watched
@router.post("/add")
def add_episode(
    show_id: int,
    season_number: int,
    episode_number: int,
    db: Session = Depends(get_db),
    uid: str = Depends(get_current_user),
):
    return add_episode_watched(db, uid, show_id, season_number, episode_number)


# Remove an episode from watched
@router.delete("/remove")
def remove_episode(
    show_id: int,
    season_number: int,
    episode_number: int,
    db: Session = Depends(get_db),
    uid: str = Depends(get_current_user),
):
    return remove_episode_watched(db, uid, show_id, season_number, episode_number)


# Get all watched episodes for the current user
@router.get("/")
def get_user_watched_episodes(
    db: Session = Depends(get_db),
    uid: str = Depends(get_current_user),
):
    return get_watched_episodes(db, uid)
