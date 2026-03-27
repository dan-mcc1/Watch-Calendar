import type { CalendarData, Show, Movie } from "../types/calendar";

interface DashboardCache {
  calendarData: CalendarData;
  watchedEpisodeKeys: Set<string>;
  currentlyWatchingShows: Show[];
  currentlyWatchingMovies: Movie[];
  uid: string;
}

let cache: DashboardCache | null = null;

export function getDashboardCache(uid: string): DashboardCache | null {
  if (cache && cache.uid === uid) return cache;
  return null;
}

export function setDashboardCache(data: DashboardCache) {
  cache = data;
}

export function clearDashboardCache() {
  cache = null;
}
