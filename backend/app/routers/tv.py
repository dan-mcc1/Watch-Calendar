from fastapi import APIRouter, Query, HTTPException, Depends
from sqlalchemy.orm import Session
from app.services.tmdb_tv import (
    fetch_show_from_tmdb,
    get_popular_shows,
    search_tv,
    get_active_popular_shows,
    get_trending_shows,
    get_shows_airing_today,
    get_upcoming_shows,
    get_shows_by_actor,
    fetch_season_data_from_tmdb,
    get_full_season_info,
)
from app.models.show import Show
from app.db.session import get_db
from app.models.show import Show

router = APIRouter()


@router.get("/popular")
def popular_shows():
    return get_popular_shows()


@router.get("/popular_this_month")
def active_popular_shows(curr_month: int = Query(...), curr_year: int = Query(...)):
    return get_active_popular_shows(curr_month, curr_year)


@router.get("/by_actor")
def by_actor(query: str):
    return get_shows_by_actor(query)


# --- DB-first single show endpoint ---
@router.get("/{id}")
def get_show_info(
    id: int,
    append: str | None = Query(None, description="Comma-separated TMDB append fields"),
    db: Session = Depends(get_db),
):
    # 1. Check DB first
    show = db.query(Show).filter(Show.id == id).first()
    if show:
        return show

    # 2. Fetch from TMDb if not in DB
    show_data = fetch_show_from_tmdb(id, append)
    if not show_data:
        raise HTTPException(status_code=404, detail="Show not found")

    return show_data


@router.get("/{id}/full")
def get_full_show_info(id: int):
    append = ",".join(
        ["watch/providers", "credits", "external_ids", "recommendations", "images"]
    )
    show_data = fetch_show_from_tmdb(id, append)
    if not show_data:
        raise HTTPException(status_code=404, detail="Show not found")

    return show_data


@router.get("/{id}/season_calendar")
def season_calendar(id: int, db: Session = Depends(get_db)):
    """
    Return the list of seasons for a show.
    If the show is not in the DB, fetch from TMDb and store it.
    """
    show = db.query(Show).filter(Show.id == id).first()

    if show:
        seasons = show.seasons
        show_id = show.id
    else:
        show_data = fetch_show_from_tmdb(id, append="seasons")
        if not show_data:
            raise HTTPException(status_code=404, detail="Show not found")
        seasons = show_data["seasons"]
        show_id = show_data["id"]

    current_seasons = sorted(seasons, key=lambda s: s["season_number"], reverse=True)[
        :2
    ]

    # calendar = []
    # for season in current_seasons:
    #     calendar.append(fetch_season_data_from_tmdb(show_id, season["season_number"]))

    # # Return seasons from DB or from the JSON field
    # return calendar
    all_episodes = [
        ep
        for season in current_seasons
        for ep in fetch_season_data_from_tmdb(show_id, season["season_number"])
    ]

    return all_episodes


@router.get("/{id}/full_calendar")
def full_calendar(id: int, db: Session = Depends(get_db)):
    """
    Return seasons and episodes for a show.
    If the show is not in the DB, fetch from TMDb and store it.
    """
    show = db.query(Show).filter(Show.id == id).first()

    if show:
        seasons = show.seasons
        show_id = show.id
    else:
        show_data = fetch_show_from_tmdb(id, append="seasons")
        if not show_data:
            raise HTTPException(status_code=404, detail="Show not found")
        seasons = show_data["seasons"]
        show_id = show_data["id"]

    calendar = []
    for season in seasons:
        calendar.append(fetch_season_data_from_tmdb(show_id, season["season_number"]))

    # Return seasons from DB or from the JSON field
    return calendar


@router.get("/{id}/season/{season_number}/info")
def full_season_info(id: int, season_number: int):
    return get_full_season_info(id, season_number)
