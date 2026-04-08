import requests
from app.config import settings

BASE_URL = "https://api.themoviedb.org/3"

HEADERS = {
    "Authorization": f"Bearer {settings.TMDB_BEARER_TOKEN}",
    "Accept": "application/json",
}

# Session with redirects disabled so the Authorization header can't leak to a
# third-party host via a MITM or unexpected TMDb redirect.
_session = requests.Session()
_session.max_redirects = 0


def get(path: str, params: dict | None = None):
    res = _session.get(
        f"{BASE_URL}{path}",
        headers=HEADERS,
        params=params or {},
        timeout=10,
        allow_redirects=False,
    )
    res.raise_for_status()
    return res.json()
