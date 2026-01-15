// src/pages/Upcoming.tsx
import { useEffect, useState } from "react";
import { API_URL, BASE_IMAGE_URL } from "../constants";
import MediaList from "../components/MediaList";
import type { Movie, Show } from "../types/calendar";

type SearchType = "tv" | "movie";

export default function Upcoming() {
  const [results, setResults] = useState<{ movies: Movie[]; shows: Show[] }>({
    shows: [],
    movies: [],
  });
  const [searchType, setSearchType] = useState<SearchType>("movie");

  const today = new Date();
  const min_date = today.toISOString().split("T")[0];

  const nextMonth = new Date(today);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const max_date = nextMonth.toISOString().split("T")[0];

  // ---------- FETCH UPCOMING ----------
  useEffect(() => {
    async function fetchUpcoming() {
      try {
        const endpoint = searchType === "tv" ? "tv" : "movie";
        const params = new URLSearchParams({
          min_date,
          max_date,
        });

        const res = await fetch(
          `${API_URL}/search/${endpoint}/upcoming?${params.toString()}`
        );

        if (!res.ok) throw new Error("Failed to fetch upcoming");

        const data = await res.json();

        // Depending on backend, data may already be Movie[] / Show[]
        // If not, normalize here safely
        if (searchType === "tv") {
          setResults({ movies: [], shows: data.results ?? [] });
        } else {
          setResults({ movies: data.results ?? [], shows: [] });
        }
      } catch (err) {
        console.error(err);
      }
    }

    fetchUpcoming();
  }, [searchType]);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Upcoming</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <select
          value={searchType}
          onChange={(e) => setSearchType(e.target.value as SearchType)}
          className="px-3 py-2 border rounded-md bg-white"
        >
          <option value="movie">Movies</option>
          <option value="tv">TV Shows</option>
        </select>
      </div>

      {/* MediaList now expects Movie | Show type */}
      <MediaList
        results={{ movies: results.movies, shows: results.shows, people: [] }}
      />
    </div>
  );
}
