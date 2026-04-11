import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../../utils/apiFetch";
import MediaList from "../MediaList";
import type { Movie } from "../../types/calendar";

export default function ComingSoonSection() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date();
    const min_date = today.toISOString().split("T")[0];
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const max_date = nextMonth.toISOString().split("T")[0];

    apiFetch(`/search/movie/upcoming?${new URLSearchParams({ min_date, max_date })}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data) setMovies(data.results ?? []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  if (!movies.length) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Coming Soon</h2>
        <Link to="/upcoming" className="text-sm text-primary-400 hover:text-primary-300 transition-colors">
          See all →
        </Link>
      </div>
      <MediaList results={{ movies: movies.slice(0, 6) }} showWatchButton={false} />
    </div>
  );
}
