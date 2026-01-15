# app/routers/user.py
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.user_service import create_user, get_user, update_user_email
from app.dependencies.auth import get_current_user

router = APIRouter()


@router.post("/create")
def create_user_route(
    db: Session = Depends(get_db),
    uid: str = Body(...),
    email: str | None = Body(None),
):
    """
    Create a user record for the currently authenticated Firebase user.
    """
    return create_user(db, uid, email)


@router.get("/me")
def get_current_user_route(
    db: Session = Depends(get_db), uid: str = Depends(get_current_user)
):
    """
    Fetch info about the currently authenticated Firebase user.
    """
    user = get_user(db, uid)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.put("/update-email")
def update_email_route(
    new_email: str, db: Session = Depends(get_db), uid: str = Depends(get_current_user)
):
    """
    Update the current user's email.
    """
    user = update_user_email(db, uid, new_email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
