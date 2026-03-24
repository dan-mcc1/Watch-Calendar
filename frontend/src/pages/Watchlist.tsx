import { useEffect, useState } from "react";
import type { Show, Movie } from "../types/calendar";
import { API_URL } from "../constants";
import { firebaseApp } from "../firebase";
import { getAuth } from "firebase/auth";
import MediaCard from "../components/MediaCard";

type TabType = "all" | "movies" | "tv";

export default function Watchlist() {
  const [results, setResults] = useState<{ movies: Movie[]; shows: Show[] }>({
    movies: [],
    shows: [],
  });
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const auth = getAuth(firebaseApp);

  async function onRemove(type: "tv" | "movie", content_id: number) {
    const user = auth.currentUser;
    if (!user) { alert("You must be signed in."); return; }

    try {
      const res = await fetch(`${API_URL}/watchlist/remove`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${await user.getIdToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content_type: type, content_id }),
      });
      if (!res.ok) throw new Error("Failed to remove item");
      setResults((prev) => ({
        movies: type === "movie" ? prev.movies.filter((m) => m.id !== content_id) : prev.movies,
        shows: type === "tv" ? prev.shows.filter((s) => s.id !== content_id) : prev.shows,
      }));
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) { alert("You must be signed in."); return; }
      try {
        const res = await fetch(`${API_URL}/watchlist`, {
          headers: {
            Authorization: `Bearer ${await user.getIdToken()}`,
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setResults({ movies: data.movies ?? [], shows: data.shows ?? [] });
      } catch (err) {
        console.error(err);
      }
    });
    return () => unsubscribe();
  }, []);

  const totalCount = results.movies.length + results.shows.length;

  const tabs: { id: TabType; label: string; count: number }[] = [
    { id: "all", label: "All", count: totalCount },
    { id: "movies", label: "Movies", count: results.movies.length },
    { id: "tv", label: "TV Shows", count: results.shows.length },
  ];

  const showMovies = activeTab === "all" || activeTab === "movies";
  const showTV = activeTab === "all" || activeTab === "tv";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-16">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-3xl font-bold text-white">My Watchlist</h1>
          <span className="bg-blue-600/20 text-blue-400 border border-blue-600/30 text-sm font-medium px-2.5 py-0.5 rounded-full">
            {totalCount}
          </span>
        </div>
        <p className="text-slate-400">Shows and movies you want to watch</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-700 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-all duration-150 border-b-2 -mb-px ${
              activeTab === tab.id
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === tab.id ? "bg-blue-600/30 text-blue-300" : "bg-slate-700 text-slate-400"
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {totalCount === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </div>
          <h3 className="text-slate-300 font-medium mb-1">Your watchlist is empty</h3>
          <p className="text-slate-500 text-sm">Browse Trending or Upcoming to find something to add</p>
        </div>
      )}

      {/* Movies */}
      {showMovies && results.movies.length > 0 && (
        <div className="mb-10">
          {activeTab === "all" && (
            <h2 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
              Movies
              <span className="text-xs text-slate-500 font-normal bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-full">
                {results.movies.length}
              </span>
            </h2>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {results.movies.map((item) => (
              <MediaCard key={`movie-${item.id}`} type="movie" item={item} onRemove={onRemove} />
            ))}
          </div>
        </div>
      )}

      {/* TV Shows */}
      {showTV && results.shows.length > 0 && (
        <div>
          {activeTab === "all" && (
            <h2 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
              TV Shows
              <span className="text-xs text-slate-500 font-normal bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-full">
                {results.shows.length}
              </span>
            </h2>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {results.shows.map((item) => (
              <MediaCard key={`tv-${item.id}`} type="tv" item={item} onRemove={onRemove} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
