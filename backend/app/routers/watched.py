from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.watched_service import (
    add_to_watched,
    get_watched,
    remove_from_watched,
    get_watched_movies_info,
    get_watched_tv_info,
)
from app.dependencies.auth import get_current_user

router = APIRouter()


@router.post("/add")
def add_item(
    content_type: str = Body(...),
    content_id: int = Body(...),
    db: Session = Depends(get_db),
    uid: str = Depends(get_current_user),  # secure current user
):
    return add_to_watched(db, uid, content_type, content_id)


@router.delete("/remove")
def remove_item(
    content_type: str = Body(...),
    content_id: int = Body(...),
    db: Session = Depends(get_db),
    uid: str = Depends(get_current_user),
):
    return remove_from_watched(db, uid, content_type, content_id)


@router.get("/")
def get_user_watched(
    db: Session = Depends(get_db),
    uid: str = Depends(get_current_user),
):
    return get_watched(db, uid)


@router.get("/tv")
def watched_tv_info(
    db: Session = Depends(get_db), uid: str = Depends(get_current_user)
):
    return get_watched_tv_info(db, uid)


@router.get("/movie")
def watched_movie_info(
    db: Session = Depends(get_db), uid: str = Depends(get_current_user)
):
    return get_watched_movies_info(db, uid)
