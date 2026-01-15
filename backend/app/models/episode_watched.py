# src/models/episode_watched.py
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Float
from sqlalchemy.sql import func
from app.db.base import Base


class EpisodeWatched(Base):
    __tablename__ = "episode_watched"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("user.id"))
    show_id = Column(Integer, ForeignKey("show.id"))
    season_number = Column(Integer)
    episode_number = Column(Integer)
    watched_at = Column(DateTime(timezone=True), server_default=func.now())
    rating = Column(Float, nullable=True)
