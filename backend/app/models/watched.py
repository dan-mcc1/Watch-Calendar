# src/models/movie_watched.py
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Float
from sqlalchemy.sql import func
from app.db.base import Base


class Watched(Base):
    __tablename__ = "watched"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("user.id"))
    content_type = Column(String)
    content_id = Column(Integer)
    watched_at = Column(DateTime(timezone=True), server_default=func.now())
    rating = Column(Float, nullable=True)
