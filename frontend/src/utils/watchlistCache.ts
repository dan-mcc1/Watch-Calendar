import type { Movie, Show } from "../types/calendar";

type WatchlistData = { movies: Movie[]; shows: Show[] };

let watchlistCache: (WatchlistData & { uid: string }) | null = null;
let watchedCache: (WatchlistData & { uid: string }) | null = null;

export function getCachedWatchlist(uid: string): WatchlistData | null {
  return watchlistCache?.uid === uid ? watchlistCache : null;
}

export function setCachedWatchlist(uid: string, data: WatchlistData) {
  watchlistCache = { ...data, uid };
}

export function getCachedWatched(uid: string): WatchlistData | null {
  return watchedCache?.uid === uid ? watchedCache : null;
}

export function setCachedWatched(uid: string, data: WatchlistData) {
  watchedCache = { ...data, uid };
}

export function clearWatchlistCache() {
  watchlistCache = null;
  watchedCache = null;
}
