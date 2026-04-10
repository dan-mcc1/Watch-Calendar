import type { CalendarData, Show, Movie } from "../types/calendar";

const TTL_MS = 5 * 60 * 1000; // 5 minutes

interface DashboardCache {
  calendarData: CalendarData;
  watchedEpisodeKeys: Set<string>;
  currentlyWatchingShows: Show[];
  currentlyWatchingMovies: Movie[];
  uid: string;
  cachedAt: number;
}

let cache: DashboardCache | null = null;

export function getDashboardCache(uid: string): DashboardCache | null {
  if (cache && cache.uid === uid && Date.now() - cache.cachedAt < TTL_MS) return cache;
  return null;
}

export function setDashboardCache(data: Omit<DashboardCache, "cachedAt">) {
  cache = { ...data, cachedAt: Date.now() };
}

export function clearDashboardCache() {
  cache = null;
}
