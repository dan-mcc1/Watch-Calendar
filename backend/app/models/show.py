# src/models/show.py
from sqlalchemy import Column, Integer, String, Boolean, Date, Text, JSON
from app.db.base import Base


class Show(Base):
    __tablename__ = "show"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    backdrop_path = Column(String)
    logo_path = Column(String)
    first_air_date = Column(Date)
    last_air_date = Column(Date)
    homepage = Column(String)
    in_production = Column(Boolean, default=False)
    number_of_seasons = Column(Integer)
    number_of_episodes = Column(Integer)
    overview = Column(Text)
    poster_path = Column(String)
    status = Column(String)
    tagline = Column(String)
    type = Column(String)
    genres = Column(JSON)  # list of genre ids
    providers = Column(JSON)
    tracking_count = Column(Integer)
    seasons = Column(JSON, nullable=True)
