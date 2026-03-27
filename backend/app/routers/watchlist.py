from fastapi import APIRouter, Depends, Body
from sqlalchemy import tuple_
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
    get_tv_calendar,
)
from app.models.watchlist import Watchlist
from app.models.watched import Watched
from app.models.currently_watching import CurrentlyWatching
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


@router.get("/tv/calendar")
def watchlist_tv_calendar(
    db: Session = Depends(get_db),
    uid: str = Depends(get_current_user),
):
    return get_tv_calendar(db, uid)


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


@router.post("/status/bulk")
def bulk_status(
    items: list[dict] = Body(...),
    db: Session = Depends(get_db),
    uid: str = Depends(get_current_user),
):
    """
    Return the watch status for a list of {content_type, content_id} pairs.
    3 DB queries regardless of list size.
    Response: { "movie:123": {status, rating}, "tv:456": {status, rating}, ... }
    """
    if not items:
        return {}

    pairs = [(i["content_type"], i["content_id"]) for i in items]

    cw_rows = db.query(CurrentlyWatching.content_type, CurrentlyWatching.content_id).filter(
        CurrentlyWatching.user_id == uid,
        tuple_(CurrentlyWatching.content_type, CurrentlyWatching.content_id).in_(pairs),
    ).all()

    wl_rows = db.query(Watchlist.content_type, Watchlist.content_id).filter(
        Watchlist.user_id == uid,
        tuple_(Watchlist.content_type, Watchlist.content_id).in_(pairs),
    ).all()

    wd_rows = db.query(Watched.content_type, Watched.content_id, Watched.rating).filter(
        Watched.user_id == uid,
        tuple_(Watched.content_type, Watched.content_id).in_(pairs),
    ).all()

    # Start with "none" for everything, then apply in ascending priority
    # so higher-priority statuses overwrite lower ones
    result = {f"{ct}:{cid}": {"status": "none", "rating": None} for ct, cid in pairs}
    for ct, cid, rating in wd_rows:
        result[f"{ct}:{cid}"] = {"status": "Watched", "rating": rating}
    for ct, cid in wl_rows:
        result[f"{ct}:{cid}"] = {"status": "Want To Watch", "rating": None}
    for ct, cid in cw_rows:
        result[f"{ct}:{cid}"] = {"status": "Currently Watching", "rating": None}

    return result


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
