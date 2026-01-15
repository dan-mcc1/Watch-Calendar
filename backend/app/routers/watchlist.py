from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.watchlist_service import (
    add_to_watchlist,
    get_watchlist,
    remove_from_watchlist,
    get_tv_watchlist_info,
    get_movie_watchlist_info,
    get_movie_watchlist_status,
    get_show_watchlist_status,
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
    return add_to_watchlist(db, uid, content_type, content_id)


@router.delete("/remove")
def remove_item(
    content_type: str = Body(...),
    content_id: int = Body(...),
    db: Session = Depends(get_db),
    uid: str = Depends(get_current_user),
):
    return remove_from_watchlist(db, uid, content_type, content_id)


@router.get("/")
def get_user_watchlist(
    db: Session = Depends(get_db),
    uid: str = Depends(get_current_user),
):
    return get_watchlist(db, uid)


@router.get("/tv")
def watchlist_tv_info(
    db: Session = Depends(get_db), uid: str = Depends(get_current_user)
):
    return get_tv_watchlist_info(db, uid)


@router.get("/movie")
def watchlist_movie_info(
    db: Session = Depends(get_db), uid: str = Depends(get_current_user)
):
    return get_movie_watchlist_info(db, uid)


@router.get("/movie/{id}/status")
def watchlist_movie_status(
    id: int, db: Session = Depends(get_db), uid: str = Depends(get_current_user)
):
    return get_movie_watchlist_status(id, db, uid)


@router.get("/tv/{id}/status")
def watchlist_movie_status(
    id: int, db: Session = Depends(get_db), uid: str = Depends(get_current_user)
):
    return get_show_watchlist_status(id, db, uid)
