// frontend/src/components/ForYouPreview.tsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../utils/apiFetch";
import MediaList from "./MediaList";
import type { Movie, Show } from "../types/calendar";

export default function ForYouPreview() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [shows, setShows] = useState<Show[]>([]);

  useEffect(() => {
    apiFetch("/recommendations/for-you")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        setMovies((data.movies ?? []).slice(0, 4));
        setShows((data.shows ?? []).slice(0, 4));
      })
      .catch(() => {});
  }, []);

  if (!movies.length && !shows.length) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">For You</h2>
        <Link to="/for-you" className="text-sm text-primary-400 hover:text-primary-300 transition-colors">
          See all →
        </Link>
      </div>
      <MediaList results={{ movies, shows, people: [] }} paginated />
    </div>
  );
}
