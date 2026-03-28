from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.sql import func
from app.db.base import Base


class Favorite(Base):
    __tablename__ = "favorite"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("user.id"), index=True, nullable=False)
    content_type = Column(String, nullable=False)  # 'movie' or 'tv'
    content_id = Column(Integer, nullable=False)
    added_at = Column(DateTime(timezone=True), server_default=func.now())
