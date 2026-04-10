import type { Movie, Show } from "../types/calendar";

type WatchlistData = { movies: Movie[]; shows: Show[] };
type CacheEntry = WatchlistData & { uid: string; cachedAt: number };

const TTL_MS = 5 * 60 * 1000; // 5 minutes

let watchlistCache: CacheEntry | null = null;
let watchedCache: CacheEntry | null = null;

function isValid(entry: CacheEntry | null, uid: string): boolean {
  return entry !== null && entry.uid === uid && Date.now() - entry.cachedAt < TTL_MS;
}

export function getCachedWatchlist(uid: string): WatchlistData | null {
  return isValid(watchlistCache, uid) ? watchlistCache : null;
}

export function setCachedWatchlist(uid: string, data: WatchlistData) {
  watchlistCache = { ...data, uid, cachedAt: Date.now() };
}

export function getCachedWatched(uid: string): WatchlistData | null {
  return isValid(watchedCache, uid) ? watchedCache : null;
}

export function setCachedWatched(uid: string, data: WatchlistData) {
  watchedCache = { ...data, uid, cachedAt: Date.now() };
}

export function clearWatchlistCache() {
  watchlistCache = null;
  watchedCache = null;
}
