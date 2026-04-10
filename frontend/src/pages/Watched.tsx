import { useEffect, useRef, useState } from "react";
import type { Show, Movie } from "../types/calendar";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../utils/apiFetch";
import { useAuthUser } from "../hooks/useAuthUser";
import MediaCard from "../components/MediaCard";
import { usePageTitle } from "../hooks/usePageTitle";

type TabType = "all" | "movies" | "tv";
type SortType =
  | "watched_desc"
  | "watched_asc"
  | "title_asc"
  | "title_desc"
  | "date_desc"
  | "date_asc"
  | "rating_desc"
  | "rating_asc"
  | "tmdb_rating_desc"
  | "tmdb_rating_asc";

const PER_PAGE = 20;

export default function Watched() {
  usePageTitle("Watched");
  const navigate = useNavigate();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [shows, setShows] = useState<Show[]>([]);
  const [moviesTotal, setMoviesTotal] = useState(0);
  const [showsTotal, setShowsTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [sort, setSort] = useState<SortType>("watched_desc");
  const [page, setPage] = useState(1);
  const user = useAuthUser();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleQueryChange(val: string) {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(val);
      setPage(1);
    }, 300);
  }

  async function onRemove(type: "tv" | "movie", content_id: number) {
    try {
      const res = await apiFetch("/watched/remove", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content_type: type, content_id }),
      });
      if (!res.ok) throw new Error("Failed to remove item");
      if (type === "movie") {
        setMovies((prev) => prev.filter((m) => m.id !== content_id));
        setMoviesTotal((n) => n - 1);
      } else {
        setShows((prev) => prev.filter((s) => s.id !== content_id));
        setShowsTotal((n) => n - 1);
      }
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();
    setLoading(true);
    (async () => {
      try {
        const params = new URLSearchParams({
          page: String(page),
          per_page: String(PER_PAGE),
          sort,
          search: debouncedQuery,
        });
        const res = await apiFetch(`/watched?${params}`, { signal: controller.signal });
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setMovies(data.movies ?? []);
        setShows(data.shows ?? []);
        setMoviesTotal(data.movies_total ?? 0);
        setShowsTotal(data.shows_total ?? 0);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [user, page, sort, debouncedQuery]);

  // Reset page when sort or tab changes
  useEffect(() => { setPage(1); }, [sort, activeTab]);

  const totalCount = moviesTotal + showsTotal;
  const showMovies = activeTab === "all" || activeTab === "movies";
  const showTV = activeTab === "all" || activeTab === "tv";

  const activeTotal = activeTab === "movies" ? moviesTotal : activeTab === "tv" ? showsTotal : Math.max(moviesTotal, showsTotal);
  const totalPages = Math.max(1, Math.ceil(activeTotal / PER_PAGE));

  const tabs: { id: TabType; label: string; count: number }[] = [
    { id: "all", label: "All", count: totalCount },
    { id: "movies", label: "Movies", count: moviesTotal },
    { id: "tv", label: "TV Shows", count: showsTotal },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-16">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-3xl font-bold text-white">Watched</h1>
          <span className="bg-success-600/20 text-success-400 border border-success-600/30 text-sm font-medium px-2.5 py-0.5 rounded-full">
            {totalCount}
          </span>
        </div>
        <p className="text-neutral-400">Everything you've already seen</p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-success-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Tabs */}
      {!loading && (
        <div className="flex gap-1 border-b border-neutral-700 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium transition-all duration-150 border-b-2 -mb-px ${
                activeTab === tab.id
                  ? "border-success-500 text-success-400"
                  : "border-transparent text-neutral-400 hover:text-neutral-200"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span
                  className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                    activeTab === tab.id
                      ? "bg-success-600/30 text-success-300"
                      : "bg-neutral-700 text-neutral-400"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Search + Sort */}
      {!loading && totalCount > 0 && (
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Search watched…"
              className="w-full bg-neutral-800 border border-neutral-700 text-neutral-200 placeholder-neutral-500 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-neutral-500"
            />
            {query && (
              <button
                onClick={() => { setQuery(""); setDebouncedQuery(""); setPage(1); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortType)}
            className="w-28 sm:w-auto shrink-0 text-sm bg-neutral-800 border border-neutral-700 text-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-neutral-500"
          >
            <option value="watched_desc">Recently Watched</option>
            <option value="watched_asc">Oldest Watched</option>
            <option value="title_asc">Title: A → Z</option>
            <option value="title_desc">Title: Z → A</option>
            <option value="date_desc">Release Date: Newest</option>
            <option value="date_asc">Release Date: Oldest</option>
            <option value="rating_desc">My Rating: High → Low</option>
            <option value="rating_asc">My Rating: Low → High</option>
            <option value="tmdb_rating_desc">TMDB Rating: High → Low</option>
            <option value="tmdb_rating_asc">TMDB Rating: Low → High</option>
          </select>
        </div>
      )}

      {/* Empty state */}
      {!loading && totalCount === 0 && !debouncedQuery && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-neutral-300 font-medium mb-1">Nothing watched yet</h3>
          <p className="text-neutral-500 text-sm mb-4">Find something to watch and mark it as watched from its detail page</p>
          <button
            onClick={() => navigate("/trending")}
            className="bg-success-600 hover:bg-success-500 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
          >
            Browse Trending
          </button>
        </div>
      )}

      {/* No search results */}
      {!loading && debouncedQuery && movies.length === 0 && shows.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-neutral-400 font-medium mb-1">No results for "{debouncedQuery}"</p>
          <p className="text-neutral-500 text-sm">Try a different search term</p>
        </div>
      )}

      {/* Movies */}
      {!loading && showMovies && movies.length > 0 && (
        <div className="mb-10">
          {activeTab === "all" && (
            <h2 className="text-lg font-semibold text-neutral-200 mb-4 flex items-center gap-2">
              Movies
              <span className="text-xs text-neutral-500 font-normal bg-neutral-800 border border-neutral-700 px-2 py-0.5 rounded-full">
                {moviesTotal}
              </span>
            </h2>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {movies.map((item) => (
              <MediaCard key={`movie-${item.id}`} type="movie" item={item} onRemove={onRemove} />
            ))}
          </div>
        </div>
      )}

      {/* TV Shows */}
      {!loading && showTV && shows.length > 0 && (
        <div>
          {activeTab === "all" && (
            <h2 className="text-lg font-semibold text-neutral-200 mb-4 flex items-center gap-2">
              TV Shows
              <span className="text-xs text-neutral-500 font-normal bg-neutral-800 border border-neutral-700 px-2 py-0.5 rounded-full">
                {showsTotal}
              </span>
            </h2>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {shows.map((item) => (
              <MediaCard key={`tv-${item.id}`} type="tv" item={item} onRemove={onRemove} />
            ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-10">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-300 hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-neutral-400">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-sm rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-300 hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
