# src/models/watchlist.py
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.sql import func
from app.db.base import Base


class Watchlist(Base):
    __tablename__ = "watchlist"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("user.id"))
    content_type = Column(String)  # 'movie' or 'tv'
    content_id = Column(Integer)  # movie or show id
    added_at = Column(DateTime(timezone=True), server_default=func.now())
