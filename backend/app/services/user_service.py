# app/services/user_service.py
from sqlalchemy.orm import Session
from datetime import datetime
from app.models.user import User


def create_user(db: Session, user_id: str, email: str = None):
    """
    Create a user in the database if they don't exist.
    """
    existing = db.query(User).filter_by(id=user_id).first()
    if existing:
        return existing

    db_user = User(
        id=user_id,
        email=email,
        created_at=datetime.utcnow(),  # optional, if you have a created_at field
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def get_user(db: Session, user_id: str):
    """
    Get a user by ID.
    """
    return db.query(User).filter_by(id=user_id).first()


def update_user_email(db: Session, user_id: str, new_email: str):
    """
    Update the email of a user.
    """
    user = db.query(User).filter_by(id=user_id).first()
    if not user:
        return None

    user.email = new_email
    db.commit()
    db.refresh(user)
    return user
