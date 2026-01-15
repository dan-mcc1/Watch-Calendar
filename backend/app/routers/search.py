from fastapi import APIRouter
from app.services.tmdb_search import (
    get_multi_search_results,
    get_tv_search_results,
    get_movie_search_results,
    get_multi_trending_results,
    get_tv_trending_results,
    get_movie_trending_results,
    get_movie_upcoming,
    get_tv_upcoming,
    get_person_search_results,
)

router = APIRouter()


@router.get("/")
def search(query: str, type: str = "all"):
    return {
        "movies": get_movie_search_results(query) if type in ("all", "movie") else [],
        "shows": get_tv_search_results(query) if type in ("all", "tv") else [],
        "people": get_person_search_results(query) if type in ("all", "person") else [],
    }


@router.get("/multi")
def multi_search(query: str):
    return get_multi_search_results(query)


@router.get("/tv")
def tv_search(query: str):
    return get_tv_search_results(query)


@router.get("/movie")
def movie_search(query: str):
    return get_movie_search_results(query)


@router.get("/person")
def person_search(query: str):
    return get_person_search_results(query)


@router.get("/multi/trending")
def multi_trending():
    return get_multi_trending_results()


@router.get("/tv/trending")
def tv_trending():
    return get_tv_trending_results()


@router.get("/movie/trending")
def movie_trending():
    return get_movie_trending_results()


@router.get("/tv/upcoming")
def tv_upcoming(min_date: str, max_date: str):
    return get_tv_upcoming(min_date, max_date)


@router.get("/movie/upcoming")
def movie_upcoming(min_date: str, max_date: str):
    return get_movie_upcoming(min_date, max_date)
