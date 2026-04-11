import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../../utils/apiFetch";
import MediaList from "../MediaList";
import type { Movie, Show } from "../../types/calendar";

export default function TrendingSection() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/search/multi/trending")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        setMovies(data.movies ?? []);
        setShows(data.shows ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  if (!movies.length && !shows.length) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold text-white">Trending</h2>
          <span className="text-lg">🔥</span>
        </div>
        <Link to="/trending" className="text-sm text-primary-400 hover:text-primary-300 transition-colors">
          See all →
        </Link>
      </div>
      <MediaList
        results={{ movies: movies.slice(0, 6), shows: shows.slice(0, 6), people: [] }}
        showWatchButton={false}
      />
    </div>
  );
}
