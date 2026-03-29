from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.watchlist import Watchlist
from app.models.movie import Movie
from app.models.show import Show
from app.services.email_service import send_notification_email, format_air_time
from datetime import date, timedelta

router = APIRouter()

VALID_FREQUENCIES = {"daily", "weekly", "monthly"}
VALID_VISIBILITIES = {"public", "friends_only", "private"}


class PreferencesUpdate(BaseModel):
    email_notifications: bool | None = None
    notification_frequency: str | None = None
    profile_visibility: str | None = None


@router.get("/preferences")
def get_notification_preferences(
    db: Session = Depends(get_db),
    uid: str = Depends(get_current_user),
):
    user = db.query(User).filter_by(id=uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "email_notifications": user.email_notifications,
        "notification_frequency": user.notification_frequency or "daily",
        "profile_visibility": user.profile_visibility or "friends_only",
    }


@router.patch("/preferences")
def update_notification_preferences(
    body: PreferencesUpdate,
    db: Session = Depends(get_db),
    uid: str = Depends(get_current_user),
):
    user = db.query(User).filter_by(id=uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if body.email_notifications is not None:
        user.email_notifications = body.email_notifications

    if body.notification_frequency is not None:
        if body.notification_frequency not in VALID_FREQUENCIES:
            raise HTTPException(status_code=422, detail="Invalid notification frequency.")
        user.notification_frequency = body.notification_frequency

    if body.profile_visibility is not None:
        if body.profile_visibility not in VALID_VISIBILITIES:
            raise HTTPException(status_code=422, detail="Invalid profile visibility.")
        user.profile_visibility = body.profile_visibility

    db.commit()
    return {
        "email_notifications": user.email_notifications,
        "notification_frequency": user.notification_frequency,
        "profile_visibility": user.profile_visibility,
    }


def _build_items_for_window(db: Session, user_id: str, days: int) -> list:
    """Find watchlisted movies/shows releasing within the next `days` days."""
    today = date.today()
    end = today + timedelta(days=days)
    upcoming = []

    movie_ids = [
        r.content_id
        for r in db.query(Watchlist.content_id)
        .filter_by(user_id=user_id, content_type="movie")
        .all()
    ]
    for mid in movie_ids:
        m = db.query(Movie).filter_by(id=mid).first()
        if m and m.release_date:
            try:
                rd = date.fromisoformat(str(m.release_date))
                if today <= rd <= end:
                    upcoming.append({"title": m.title, "date": str(rd)})
            except (ValueError, TypeError):
                pass

    show_ids = [
        r.content_id
        for r in db.query(Watchlist.content_id)
        .filter_by(user_id=user_id, content_type="tv")
        .all()
    ]
    for sid in show_ids:
        s = db.query(Show).filter_by(id=sid).first()
        if s and s.last_air_date:
            try:
                lad = date.fromisoformat(str(s.last_air_date))
                if today <= lad <= end:
                    upcoming.append({
                        "title": s.name,
                        "date": str(lad),
                        "air_time": format_air_time(s.air_time, s.air_timezone),
                    })
            except (ValueError, TypeError):
                pass

    return upcoming


def _frequency_window(frequency: str) -> int:
    """Return the number of days to look ahead for a given frequency."""
    return {"daily": 1, "weekly": 7, "monthly": 30}.get(frequency, 1)


def _should_send_today(frequency: str) -> bool:
    """Return True if the digest should be sent today for the given frequency."""
    today = date.today()
    if frequency == "daily":
        return True
    if frequency == "weekly":
        return today.weekday() == 0  # Monday
    if frequency == "monthly":
        return today.day == 1
    return False


def send_daily_digest_to_all(db: Session):
    """
    Send digest emails to all opted-in users.
    Respects each user's notification_frequency — weekly users only get emails
    on Mondays, monthly users only on the 1st.
    """
    users = (
        db.query(User)
        .filter(User.email_notifications == True, User.email != None)
        .all()
    )
    for user in users:
        try:
            freq = user.notification_frequency or "daily"
            if not _should_send_today(freq):
                continue
            window = _frequency_window(freq)
            items = _build_items_for_window(db, user.id, window)
            if items:
                send_notification_email(user.email, user.username or "", items)
        except Exception as e:
            print(f"[digest] Failed for {user.email}: {e}")


@router.post("/send-digest")
def send_digest(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    uid: str = Depends(get_current_user),
):
    """Trigger a digest email for the current user (uses their frequency window)."""
    user = db.query(User).filter_by(id=uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.email_notifications:
        raise HTTPException(status_code=400, detail="Email notifications are disabled")
    if not user.email:
        raise HTTPException(status_code=400, detail="No email address on file")

    freq = user.notification_frequency or "daily"
    window = _frequency_window(freq)
    upcoming = _build_items_for_window(db, uid, window)

    background_tasks.add_task(
        send_notification_email, user.email, user.username or "", upcoming
    )
    return {"message": "Digest email queued"}
