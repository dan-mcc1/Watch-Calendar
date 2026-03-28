from fastapi import APIRouter, Depends, Body, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.dependencies.auth import get_current_user
from app.services.favorite_service import (
    add_to_favorites,
    remove_from_favorites,
    get_favorites,
    is_favorited,
)

router = APIRouter()


@router.get("/")
def get_user_favorites(
    db: Session = Depends(get_db),
    uid: str = Depends(get_current_user),
):
    return get_favorites(db, uid)


@router.get("/status")
def get_favorite_status(
    content_type: str = Query(...),
    content_id: int = Query(...),
    db: Session = Depends(get_db),
    uid: str = Depends(get_current_user),
):
    return {"favorited": is_favorited(db, uid, content_type, content_id)}


@router.post("/add")
def add_favorite(
    content_type: str = Body(...),
    content_id: int = Body(...),
    db: Session = Depends(get_db),
    uid: str = Depends(get_current_user),
):
    if content_type not in ("movie", "tv"):
        raise HTTPException(status_code=400, detail="content_type must be 'movie' or 'tv'")
    return add_to_favorites(db, uid, content_type, content_id)


@router.delete("/remove")
def remove_favorite(
    content_type: str = Body(...),
    content_id: int = Body(...),
    db: Session = Depends(get_db),
    uid: str = Depends(get_current_user),
):
    return remove_from_favorites(db, uid, content_type, content_id)
