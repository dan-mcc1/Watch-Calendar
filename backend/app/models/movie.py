# src/models/movie.py
from sqlalchemy import Column, Integer, String, Text, Date, Float, JSON
from sqlalchemy.dialects.postgresql import ARRAY
from app.db.base import Base


class Movie(Base):
    __tablename__ = "movie"

    id = Column(Integer, primary_key=True)
    imdb_id = Column(String)
    backdrop_path = Column(String)
    logo_path = Column(String)
    budget = Column(Float)
    genres = Column(JSON)  # genre ids
    homepage = Column(String)
    overview = Column(Text)
    tagline = Column(String)
    poster_path = Column(String)
    release_date = Column(Date)
    revenue = Column(Float)
    runtime = Column(Integer)
    status = Column(String)
    title = Column(String)
    providers = Column(JSON)
    tracking_count = Column(Integer)
