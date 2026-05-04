"""
Tests for watchlist endpoints: add, remove, fetch, pagination, sort, search,
bulk-status, and tracking_count bookkeeping.
"""

import pytest
import json
from tests.conftest import make_client

# ── Helpers ──────────────────────────────────────────────────────────────────


def add_movie(client, movie_id=550):
    return client.request(
        "POST",
        "/watchlist/add",
        json={"content_type": "movie", "content_id": movie_id},
        headers={"Content-Type": "application/json"},
    )


def add_show(client, show_id=1396):
    return client.request(
        "POST",
        "/watchlist/add",
        json={"content_type": "tv", "content_id": show_id},
        headers={"Content-Type": "application/json"},
    )


def remove_movie(client, movie_id=550):
    return client.request(
        "DELETE",
        "/watchlist/remove",
        content=json.dumps({"content_type": "movie", "content_id": movie_id}),
        headers={"Content-Type": "application/json"},
    )


def remove_show(client, show_id=1396):
    return client.request(
        "DELETE",
        "/watchlist/remove",
        content=json.dumps({"content_type": "tv", "content_id": show_id}),
        headers={"Content-Type": "application/json"},
    )


# ── Add ──────────────────────────────────────────────────────────────────────


class TestWatchlistAdd:
    def test_add_movie(self, client, seed_movie):
        r = add_movie(client)
        assert r.status_code == 200

    def test_add_show(self, client, seed_show):
        r = add_show(client)
        assert r.status_code == 200

    def test_add_movie_idempotent(self, client, seed_movie):
        add_movie(client)
        r = add_movie(client)
        assert r.status_code == 200  # returns existing, no error

    def test_add_show_idempotent(self, client, seed_show):
        add_show(client)
        r = add_show(client)
        assert r.status_code == 200

    def test_add_invalid_content_type(self, client, seed_movie):
        r = client.post(
            "/watchlist/add",
            json={"content_type": "podcast", "content_id": 550},
        )
        assert r.status_code == 400

    def test_add_increments_tracking_count(self, client, db, seed_movie):
        from app.models.movie import Movie

        add_movie(client)
        db.expire_all()
        m = db.query(Movie).filter_by(id=550).first()
        assert m.tracking_count == 1

    def test_add_show_increments_tracking_count(self, client, db, seed_show):
        from app.models.show import Show

        add_show(client)
        db.expire_all()
        s = db.query(Show).filter_by(id=1396).first()
        assert s.tracking_count == 1

    def test_two_users_both_track_increments_count_twice(self, db, seed_movie):
        c1 = make_client("test-uid-1")
        c2 = make_client("test-uid-2")
        add_movie(c1)
        add_movie(c2)
        from app.models.movie import Movie

        db.expire_all()
        m = db.query(Movie).filter_by(id=550).first()
        assert m.tracking_count == 2


# ── Remove ───────────────────────────────────────────────────────────────────


class TestWatchlistRemove:
    def test_remove_movie(self, client, seed_movie):
        add_movie(client)
        r = remove_movie(client)
        assert r.status_code == 200

    def test_remove_nonexistent(self, client, seed_movie):
        r = remove_movie(client)
        assert r.status_code == 200
        assert "not found" in r.json()["message"].lower()

    def test_remove_decrements_tracking_count(self, client, db, seed_movie):
        from app.models.movie import Movie

        add_movie(client)
        remove_movie(client)
        db.expire_all()
        m = db.query(Movie).filter_by(id=550).first()
        # tracking_count hits 0 → movie is deleted
        assert m is None

    def test_remove_show_decrements_tracking_count(self, client, db, seed_show):
        from app.models.show import Show

        add_show(client)
        remove_show(client)
        db.expire_all()
        s = db.query(Show).filter_by(id=1396).first()
        assert s is None

    def test_remove_does_not_delete_when_another_user_tracks(self, db, seed_movie):
        from app.models.movie import Movie

        c1 = make_client("test-uid-1")
        c2 = make_client("test-uid-2")
        add_movie(c1)
        add_movie(c2)
        remove_movie(c1)
        db.expire_all()
        m = db.query(Movie).filter_by(id=550).first()
        assert m is not None
        assert m.tracking_count == 1


# ── Fetch ────────────────────────────────────────────────────────────────────


class TestWatchlistFetch:
    def test_fetch_empty(self, client, seed_users):
        r = client.get("/watchlist")
        assert r.status_code == 200
        data = r.json()
        assert data["movies"] == []
        assert data["shows"] == []

    def test_fetch_includes_added_movie(self, client, seed_movie):
        add_movie(client)
        r = client.get("/watchlist")
        assert r.status_code == 200
        data = r.json()
        assert len(data["movies"]) == 1
        assert data["movies"][0]["id"] == 550

    def test_fetch_includes_added_show(self, client, seed_show):
        add_show(client)
        r = client.get("/watchlist")
        data = r.json()
        assert len(data["shows"]) == 1
        assert data["shows"][0]["id"] == 1396

    def test_fetch_returns_all_movies(self, client, db, seed_users):
        from app.models.movie import Movie
        from app.models.watchlist import Watchlist
        from datetime import datetime

        for i in range(1, 6):
            db.add(Movie(id=i, title=f"Movie {i}", tracking_count=0))
        db.flush()
        for i in range(1, 6):
            db.add(
                Watchlist(
                    user_id="test-uid-1",
                    content_type="movie",
                    content_id=i,
                    added_at=datetime.utcnow(),
                )
            )
        db.commit()

        r = client.get("/watchlist")
        assert r.status_code == 200
        assert len(r.json()["movies"]) == 5


# ── Bulk Status ──────────────────────────────────────────────────────────────


class TestBulkStatus:
    def test_bulk_status_none(self, client, seed_movie, seed_users):
        r = client.post(
            "/watchlist/status/bulk",
            json=[{"content_type": "movie", "content_id": 550}],
        )
        assert r.status_code == 200
        assert r.json()["movie:550"]["status"] == "none"

    def test_bulk_status_want_to_watch(self, client, seed_movie, seed_users):
        add_movie(client)
        r = client.post(
            "/watchlist/status/bulk",
            json=[{"content_type": "movie", "content_id": 550}],
        )
        assert r.json()["movie:550"]["status"] == "Want To Watch"

    def test_bulk_status_watched(self, client, db, seed_movie, seed_users):
        from app.models.watched import Watched
        from datetime import datetime

        db.add(
            Watched(
                user_id="test-uid-1",
                content_type="movie",
                content_id=550,
                watched_at=datetime.utcnow(),
            )
        )
        db.commit()
        r = client.post(
            "/watchlist/status/bulk",
            json=[{"content_type": "movie", "content_id": 550}],
        )
        assert r.json()["movie:550"]["status"] == "Watched"

    def test_bulk_status_currently_watching(self, client, db, seed_show, seed_users):
        from app.models.currently_watching import CurrentlyWatching
        from datetime import datetime

        db.add(
            CurrentlyWatching(
                user_id="test-uid-1",
                content_type="tv",
                content_id=1396,
                added_at=datetime.utcnow(),
            )
        )
        db.commit()
        r = client.post(
            "/watchlist/status/bulk",
            json=[{"content_type": "tv", "content_id": 1396}],
        )
        assert r.json()["tv:1396"]["status"] == "Currently Watching"

    def test_bulk_status_multiple_items(
        self, client, db, seed_movie, seed_show, seed_users
    ):
        from app.models.watchlist import Watchlist
        from datetime import datetime

        db.add(
            Watchlist(
                user_id="test-uid-1",
                content_type="movie",
                content_id=550,
                added_at=datetime.utcnow(),
            )
        )
        db.commit()
        r = client.post(
            "/watchlist/status/bulk",
            json=[
                {"content_type": "movie", "content_id": 550},
                {"content_type": "tv", "content_id": 1396},
            ],
        )
        data = r.json()
        assert data["movie:550"]["status"] == "Want To Watch"
        assert data["tv:1396"]["status"] == "none"

    def test_bulk_status_empty_list(self, client):
        r = client.post("/watchlist/status/bulk", json=[])
        assert r.status_code == 200
        assert r.json() == {}
