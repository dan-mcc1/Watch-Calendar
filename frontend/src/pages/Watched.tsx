// src/pages/Search.tsx
import { useEffect, useState } from "react";
import type { Show, Movie } from "../types/calendar";
import { API_URL } from "../constants";
import { firebaseApp } from "../firebase";
import { getAuth } from "firebase/auth";
import MediaCard from "../components/MediaCard";

export default function Watched() {
  const [results, setResults] = useState<{
    movies: Movie[];
    shows: Show[];
  }>({
    movies: [],
    shows: [],
  });
  const auth = getAuth(firebaseApp);

  async function onRemove(type: "tv" | "movie", content_id: number) {
    const user = auth.currentUser;
    if (!user) {
      alert("You must be signed in.");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/watched/remove`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${await user.getIdToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content_type: type,
          content_id: content_id,
        }),
      });

      if (!res.ok) throw new Error("Failed to remove item");

      // Update local state
      setResults((prev) => ({
        movies:
          type === "movie"
            ? prev.movies.filter((m) => m.id !== content_id)
            : prev.movies,
        shows:
          type === "tv"
            ? prev.shows.filter((s) => s.id !== content_id)
            : prev.shows,
      }));
    } catch (err) {
      console.error(err);
    }
  }

  // Fetch search results
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        alert("You must be signed in.");
        return;
      }

      try {
        const res = await fetch(`${API_URL}/watched`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${await user.getIdToken()}`,
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) throw new Error("Failed to fetch search results");

        const data = await res.json();
        setResults({
          movies: data.movies ?? [],
          shows: data.shows ?? [],
        });
      } catch (err) {
        console.error(err);
      }
    });

    return () => unsubscribe(); // cleanup on unmount
  }, []);

  return (
    <div className="mx-auto max-w-7xl">
      <h2 className="mb-2 text-xl font-semibold">Movies</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.movies.map((item) => (
          <MediaCard
            key={`movie-${item.id}`}
            type="movie"
            item={item}
            onRemove={onRemove}
          />
        ))}
      </div>
      <h2 className="mb-2 text-xl font-semibold">TV Shows</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.shows.map((item) => (
          <MediaCard
            key={`tv-${item.id}`}
            type="tv"
            item={item}
            onRemove={onRemove}
          />
        ))}
      </div>
    </div>
  );
}
