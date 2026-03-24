# app/services/episode_service.py
from sqlalchemy.orm import Session
from app.models.episode import Episode
from app.models.show import Show
from app.services.tmdb_client import get


def ensure_show_in_db(db: Session, show_id: int) -> bool:
    """
    Ensure the show row exists in the show table so episode FKs are satisfied.
    Returns True if show exists or was created, False if TMDB fetch failed.
    """
    if db.query(Show).filter_by(id=show_id).first():
        return True

    try:
        show_data = get(f"/tv/{show_id}")
    except Exception:
        return False

    if not show_data or not show_data.get("name"):
        return False

    show = Show(
        id=show_data["id"],
        name=show_data["name"],
        backdrop_path=show_data.get("backdrop_path"),
        logo_path=None,
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
        tracking_count=0,
    )
    db.add(show)
    db.commit()
    return True


def sync_season_episodes(db: Session, show_id: int, season_number: int):
    """
    Fetch all episodes for a single season from TMDB and upsert into the
    episode table. Ensures the show row exists first.
    """
    if not ensure_show_in_db(db, show_id):
        return

    try:
        season_data = get(f"/tv/{show_id}/season/{season_number}")
    except Exception:
        return

    for ep in season_data.get("episodes", []):
        ep_id = ep.get("id")
        if not ep_id:
            continue

        if db.query(Episode).filter_by(id=ep_id).first():
            continue

        db.add(Episode(
            id=ep_id,
            show_id=show_id,
            season_number=season_number,
            episode_number=ep.get("episode_number"),
            name=ep.get("name"),
            overview=ep.get("overview"),
            air_date=ep.get("air_date") or None,
            runtime=ep.get("runtime"),
            still_path=ep.get("still_path"),
            vote_average=ep.get("vote_average"),
        ))

    db.commit()


def sync_show_episodes(db: Session, show_id: int):
    """
    Fetch all episodes for a show from TMDB and insert any that are not
    already stored. Skips season 0 (specials). Safe to call multiple times.
    """
    if not ensure_show_in_db(db, show_id):
        return

    show = db.query(Show).filter_by(id=show_id).first()
    if not show or not show.seasons:
        return

    for season in show.seasons:
        season_number = season.get("season_number", 0)
        if season_number == 0:
            continue

        try:
            season_data = get(f"/tv/{show_id}/season/{season_number}")
        except Exception:
            continue

        for ep in season_data.get("episodes", []):
            ep_id = ep.get("id")
            if not ep_id:
                continue

            existing = db.query(Episode).filter_by(id=ep_id).first()
            if existing:
                continue

            air_date_str = ep.get("air_date") or None

            episode = Episode(
                id=ep_id,
                show_id=show_id,
                season_number=season_number,
                episode_number=ep.get("episode_number"),
                name=ep.get("name"),
                overview=ep.get("overview"),
                air_date=air_date_str,
                runtime=ep.get("runtime"),
                still_path=ep.get("still_path"),
                vote_average=ep.get("vote_average"),
            )
            db.add(episode)

    db.commit()


def maybe_sync_show_episodes(db: Session, show_id: int):
    """
    Sync episodes only if none are stored yet for this show.
    """
    existing = db.query(Episode).filter_by(show_id=show_id).first()
    if existing:
        return
    sync_show_episodes(db, show_id)


def get_or_create_episode(
    db: Session, show_id: int, season_number: int, episode_number: int
) -> Episode | None:
    """
    Return the Episode row for the given show/season/episode, fetching from
    TMDB and inserting it if it isn't already stored.
    """
    episode = (
        db.query(Episode)
        .filter_by(
            show_id=show_id,
            season_number=season_number,
            episode_number=episode_number,
        )
        .first()
    )
    if episode:
        return episode

    ensure_show_in_db(db, show_id)

    try:
        ep_data = get(f"/tv/{show_id}/season/{season_number}/episode/{episode_number}")
    except Exception:
        return None

    ep_id = ep_data.get("id")
    if not ep_id:
        return None

    episode = Episode(
        id=ep_id,
        show_id=show_id,
        season_number=season_number,
        episode_number=episode_number,
        name=ep_data.get("name"),
        overview=ep_data.get("overview"),
        air_date=ep_data.get("air_date") or None,
        runtime=ep_data.get("runtime"),
        still_path=ep_data.get("still_path"),
        vote_average=ep_data.get("vote_average"),
    )
    db.add(episode)
    db.commit()
    db.refresh(episode)
    return episode


def get_episodes_for_season(db: Session, show_id: int, season_number: int):
    return (
        db.query(Episode)
        .filter_by(show_id=show_id, season_number=season_number)
        .order_by(Episode.episode_number)
        .all()
    )
