import requests
from app.config import settings

BASE_URL = "https://api.themoviedb.org/3"

HEADERS = {
    "Authorization": f"Bearer {settings.TMDB_BEARER_TOKEN}",
    "Accept": "application/json",
}


def get(path: str, params: dict | None = None):
    res = requests.get(f"{BASE_URL}{path}", headers=HEADERS, params=params or {})
    res.raise_for_status()
    return res.json()
