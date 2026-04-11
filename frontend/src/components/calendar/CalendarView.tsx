import { useState, useEffect, useRef } from "react";
import type { Movie, CalendarData, ShowWithCalendar } from "../../types/calendar";
import "react-datepicker/dist/react-datepicker.css";
import CalendarSyncModal from "../CalendarSyncModal";
import { useAuthUser } from "../../hooks/useAuthUser";
import { apiFetch } from "../../utils/apiFetch";
import { getDashboardCache, setDashboardCache } from "../../utils/dashboardCache";
import CalendarHeader from "./CalendarHeader";
import CalendarControls, { ViewMode } from "./CalendarControls";
import CalendarMonthGrid from "./CalendarMonthGrid";
import CalendarWeekGrid from "./CalendarWeekGrid";
import CalendarDayDetail from "./CalendarDayDetail";
import {
  buildAllItems,
  getItemsForDate,
  applyFilters,
  getDaysInMonth,
  getWeekDays,
  countUpcomingThisMonth,
  type DayItem,
} from "../../utils/calendarUtils";

function mkMonthKey(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

function monthBounds(year: number, month: number): { from: string; to: string } {
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return {
    from: fmt(new Date(year, month, 1)),
    to: fmt(new Date(year, month + 1, 0)),
  };
}

function mergeShows(existing: ShowWithCalendar[], incoming: ShowWithCalendar[]): ShowWithCalendar[] {
  const showMap = new Map<number, ShowWithCalendar>();
  for (const item of existing) showMap.set(item.show.id, item);
  for (const item of incoming) {
    if (showMap.has(item.show.id)) {
      const prev = showMap.get(item.show.id)!;
      const epIds = new Set(prev.episodes.map((e) => e.id));
      const newEps = item.episodes.filter((e) => !epIds.has(e.id));
      showMap.set(item.show.id, { ...prev, episodes: [...prev.episodes, ...newEps] });
    } else {
      showMap.set(item.show.id, item);
    }
  }
  return Array.from(showMap.values());
}

// 6 months per chunk; pre-fetch when within one chunk of the edge
const CHUNK_MONTHS = 6;
const PREFETCH_THRESHOLD = CHUNK_MONTHS;

function addMonths(year: number, month: number, delta: number): { year: number; month: number } {
  const total = year * 12 + month + delta;
  return { year: Math.floor(total / 12), month: ((total % 12) + 12) % 12 };
}

function monthOffset(y1: number, m1: number, y2: number, m2: number): number {
  return (y2 - y1) * 12 + (m2 - m1);
}

export default function CalendarView() {
  const user = useAuthUser();

  // Data state (previously owned by Dashboard)
  const [isLoading, setIsLoading] = useState(false);
  const [calendarData, setCalendarData] = useState<CalendarData>({ shows: [], movies: [] });
  const [watchedEpisodeKeys, setWatchedEpisodeKeys] = useState<Set<string>>(new Set());
  const [showWatchlist, setShowWatchlist] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);

  // Track the contiguous loaded date range as month keys (YYYY-MM)
  const loadedFrom = useRef<string>("");
  const loadedTo = useRef<string>("");
  const fetchingForward = useRef(false);
  const fetchingBackward = useRef(false);

  async function fetchChunk(
    fromYear: number,
    fromMonth: number,
    size: number,
    direction: "forward" | "backward",
    silent = true,
  ): Promise<void> {
    if (direction === "forward" && fetchingForward.current) return;
    if (direction === "backward" && fetchingBackward.current) return;

    if (direction === "forward") fetchingForward.current = true;
    else fetchingBackward.current = true;

    if (!silent) setIsLoading(true);
    try {
      const toEnd = addMonths(fromYear, fromMonth, size - 1);
      const from = monthBounds(fromYear, fromMonth).from;
      const to = monthBounds(toEnd.year, toEnd.month).to;

      const res = await apiFetch(`/watchlist/tv/calendar?from_date=${from}&to_date=${to}`);
      if (!res.ok) return;
      const newShows: ShowWithCalendar[] = await res.json();

      setCalendarData((prev) => ({ ...prev, shows: mergeShows(prev.shows, newShows) }));

      const fromKey = mkMonthKey(fromYear, fromMonth);
      const toKey = mkMonthKey(toEnd.year, toEnd.month);
      if (!loadedFrom.current || fromKey < loadedFrom.current) loadedFrom.current = fromKey;
      if (!loadedTo.current || toKey > loadedTo.current) loadedTo.current = toKey;
    } finally {
      if (direction === "forward") fetchingForward.current = false;
      else fetchingBackward.current = false;
      if (!silent) setIsLoading(false);
    }
  }

  function maybePrefetch(year: number, month: number) {
    if (!loadedFrom.current || !loadedTo.current) return;

    const [toYear, toMonth0] = loadedTo.current.split("-").map(Number);
    const toMonth = toMonth0 - 1;
    const distToEnd = monthOffset(year, month, toYear, toMonth);
    if (distToEnd <= PREFETCH_THRESHOLD && !fetchingForward.current) {
      const next = addMonths(toYear, toMonth, 1);
      fetchChunk(next.year, next.month, CHUNK_MONTHS, "forward", true);
    }

    const [fromYear, fromMonth0] = loadedFrom.current.split("-").map(Number);
    const fromMonth = fromMonth0 - 1;
    const distToStart = monthOffset(fromYear, fromMonth, year, month);
    if (distToStart <= PREFETCH_THRESHOLD && !fetchingBackward.current) {
      const prev = addMonths(fromYear, fromMonth, -CHUNK_MONTHS);
      fetchChunk(prev.year, prev.month, CHUNK_MONTHS, "backward", true);
    }
  }

  async function fetchMovieCalendar(): Promise<Movie[]> {
    const res = await apiFetch("/watchlist/movie");
    if (!res.ok) return [];
    return res.json();
  }

  async function fetchWatchedMovies(): Promise<Movie[]> {
    const res = await apiFetch("/watched/movie");
    if (!res.ok) return [];
    return res.json();
  }

  async function fetchWatchedEpisodeKeys(): Promise<Set<string>> {
    const res = await apiFetch("/watched-episode/");
    if (!res.ok) return new Set();
    const data: { show_id: number; season_number: number; episode_number: number }[] = await res.json();
    return new Set(data.map((e) => `${e.show_id}_${e.season_number}_${e.episode_number}`));
  }

  async function fetchCurrentlyWatchingMovies(): Promise<Movie[]> {
    const res = await apiFetch("/currently-watching/");
    if (!res.ok) return [];
    const data = await res.json();
    return data.movies ?? [];
  }

  useEffect(() => {
    if (!user) {
      setCalendarData({ shows: [], movies: [] });
      return;
    }

    const cached = getDashboardCache(user.uid);
    if (cached) {
      setCalendarData(cached.calendarData);
      setWatchedEpisodeKeys(cached.watchedEpisodeKeys);
      loadedFrom.current = cached.loadedFrom;
      loadedTo.current = cached.loadedTo;
      return;
    }

    async function fetchAll() {
      setIsLoading(true);
      try {
        const today = new Date();
        const yr = today.getFullYear();
        const mo = today.getMonth();

        // Initial load: 3 chunks (prev + current + next) = 18 months centered on today
        const start = addMonths(yr, mo, -(CHUNK_MONTHS * 1.5));
        const end = addMonths(yr, mo, CHUNK_MONTHS * 1.5 - 1);
        const from = monthBounds(start.year, start.month).from;
        const to = monthBounds(end.year, end.month).to;

        const [tvShows, watchlistMovies, watchedMovies, episodeKeys, cwMovies] = await Promise.all([
          apiFetch(`/watchlist/tv/calendar?from_date=${from}&to_date=${to}`)
            .then((r) => (r.ok ? r.json() : [])) as Promise<ShowWithCalendar[]>,
          fetchMovieCalendar(),
          fetchWatchedMovies(),
          fetchWatchedEpisodeKeys(),
          fetchCurrentlyWatchingMovies(),
        ]);

        loadedFrom.current = mkMonthKey(start.year, start.month);
        loadedTo.current = mkMonthKey(end.year, end.month);

        const movieMap = new Map<number, Movie>();
        for (const m of watchlistMovies) movieMap.set(m.id, { ...m, isWatched: false });
        for (const m of watchedMovies) movieMap.set(m.id, { ...m, isWatched: true });
        for (const m of cwMovies) {
          if (!movieMap.has(m.id)) movieMap.set(m.id, { ...m, isWatched: false });
        }

        const data: CalendarData = { shows: tvShows, movies: Array.from(movieMap.values()) };
        setWatchedEpisodeKeys(episodeKeys);
        setCalendarData(data);
        setDashboardCache({
          calendarData: data,
          watchedEpisodeKeys: episodeKeys,
          currentlyWatchingShows: [],
          currentlyWatchingMovies: cwMovies,
          loadedFrom: loadedFrom.current,
          loadedTo: loadedTo.current,
          uid: user!.uid,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAll();
  }, [user]);

  function handleEpisodeWatched(showId: number, season: number, episode: number) {
    const key = `${showId}_${season}_${episode}`;
    setWatchedEpisodeKeys((prev) => new Set([...prev, key]));
  }

  const allItems = buildAllItems(calendarData);

  const episodeListRef = useRef<HTMLDivElement>(null);
  const [filterType, setFilterType] = useState<"all" | "tv" | "movie">("all");
  const [watchFilter, setWatchFilter] = useState<"all" | "watched" | "unwatched">("all");
  const [viewMode, setViewMode] = useState<ViewMode>(() =>
    typeof window !== "undefined" && window.innerWidth < 640 ? "day" : "month",
  );

  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [daysOfMonth, setDaysOfMonth] = useState<DayItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<DayItem>({
    date: today,
    items: allItems,
  });

  const handlePrev = () => {
    if (viewMode === "month") {
      const newMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const newYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      setCurrentMonth(newMonth);
      setCurrentYear(newYear);
      const d = new Date(newYear, newMonth, 1);
      setSelectedDate({ date: d, items: applyFilters(getItemsForDate(allItems, d), filterType, watchFilter, watchedEpisodeKeys) });
      maybePrefetch(newYear, newMonth);
    } else if (viewMode === "week") {
      const newDate = new Date(selectedDate.date);
      newDate.setDate(newDate.getDate() - 7);
      setCurrentMonth(newDate.getMonth());
      setCurrentYear(newDate.getFullYear());
      setSelectedDate({ date: newDate, items: applyFilters(getItemsForDate(allItems, newDate), filterType, watchFilter, watchedEpisodeKeys) });
      maybePrefetch(newDate.getFullYear(), newDate.getMonth());
    } else {
      const newDate = new Date(selectedDate.date);
      newDate.setDate(newDate.getDate() - 1);
      setCurrentMonth(newDate.getMonth());
      setCurrentYear(newDate.getFullYear());
      setSelectedDate({ date: newDate, items: applyFilters(getItemsForDate(allItems, newDate), filterType, watchFilter, watchedEpisodeKeys) });
      maybePrefetch(newDate.getFullYear(), newDate.getMonth());
    }
  };

  const handleNext = () => {
    if (viewMode === "month") {
      const newMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const newYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      setCurrentMonth(newMonth);
      setCurrentYear(newYear);
      const d = new Date(newYear, newMonth, 1);
      setSelectedDate({ date: d, items: applyFilters(getItemsForDate(allItems, d), filterType, watchFilter, watchedEpisodeKeys) });
      maybePrefetch(newYear, newMonth);
    } else if (viewMode === "week") {
      const newDate = new Date(selectedDate.date);
      newDate.setDate(newDate.getDate() + 7);
      setCurrentMonth(newDate.getMonth());
      setCurrentYear(newDate.getFullYear());
      setSelectedDate({ date: newDate, items: applyFilters(getItemsForDate(allItems, newDate), filterType, watchFilter, watchedEpisodeKeys) });
      maybePrefetch(newDate.getFullYear(), newDate.getMonth());
    } else {
      const newDate = new Date(selectedDate.date);
      newDate.setDate(newDate.getDate() + 1);
      setCurrentMonth(newDate.getMonth());
      setCurrentYear(newDate.getFullYear());
      setSelectedDate({ date: newDate, items: applyFilters(getItemsForDate(allItems, newDate), filterType, watchFilter, watchedEpisodeKeys) });
      maybePrefetch(newDate.getFullYear(), newDate.getMonth());
    }
  };

  useEffect(() => {
    setSelectedDate({ date: today, items: applyFilters(getItemsForDate(allItems, today), filterType, watchFilter, watchedEpisodeKeys) });
  }, [calendarData]);

  useEffect(() => {
    setDaysOfMonth(getDaysInMonth(currentMonth, currentYear, allItems, filterType, watchFilter, watchedEpisodeKeys));
  }, [currentMonth, currentYear, calendarData, filterType, watchFilter, watchedEpisodeKeys]);

  const upcomingThisMonth = countUpcomingThisMonth(allItems, today, currentMonth, currentYear);
  const todayItemCount = applyFilters(getItemsForDate(allItems, today), filterType, watchFilter, watchedEpisodeKeys).length;

  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  const getCenterLabel = (): string => {
    if (viewMode === "month") return `${monthNames[currentMonth]} ${currentYear}`;
    if (viewMode === "week") {
      const days = getWeekDays(selectedDate.date, allItems, filterType, watchFilter, watchedEpisodeKeys);
      const start = days[0].date;
      const end = days[6].date;
      if (start.getMonth() === end.getMonth())
        return `${monthNames[start.getMonth()]} ${start.getDate()} - ${end.getDate()}, ${start.getFullYear()}`;
      return `${monthNames[start.getMonth()].slice(0, 3)} ${start.getDate()} - ${monthNames[end.getMonth()].slice(0, 3)} ${end.getDate()}, ${end.getFullYear()}`;
    }
    return selectedDate.date.toLocaleDateString(undefined, { weekday: "short", year: "numeric", month: "short", day: "numeric" });
  };

  const emptyCells = Array(new Date(currentYear, currentMonth, 1).getDay()).fill(null);

  return (
    <div className="lg:flex lg:h-full lg:flex-col max-w-7xl mx-auto">
      <CalendarHeader
        upcomingThisMonth={upcomingThisMonth}
        todayItemCount={todayItemCount}
        viewMode={viewMode}
        onGoToToday={() => {
          const t = new Date();
          setCurrentMonth(t.getMonth());
          setCurrentYear(t.getFullYear());
          setSelectedDate({ date: t, items: applyFilters(getItemsForDate(allItems, t), filterType, watchFilter, watchedEpisodeKeys) });
        }}
      />

      <CalendarControls
        viewMode={viewMode}
        onViewChange={setViewMode}
        filterType={filterType}
        onFilterTypeChange={setFilterType}
        watchFilter={watchFilter}
        onWatchFilterChange={setWatchFilter}
        centerLabel={getCenterLabel()}
        onPrev={handlePrev}
        onNext={handleNext}
        user={user}
        onSyncCalendar={() => setShowSyncModal(true)}
        showWatchlist={showWatchlist}
        onOpenWatchlist={() => setShowWatchlist(true)}
        onCloseWatchlist={() => setShowWatchlist(false)}
        calendarData={calendarData}
        setCalendarData={setCalendarData}
      />

      {/* Initial-release disclaimer */}
      <div className="px-4 py-1.5 bg-neutral-900/60 border-b border-neutral-700/50 flex items-center gap-1.5">
        <svg className="w-3 h-3 text-neutral-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-xs text-neutral-500">Shows initial air dates only — reruns are not included.</p>
      </div>

      {viewMode === "month" && (
        <CalendarMonthGrid
          days={daysOfMonth}
          emptyCells={emptyCells}
          today={today}
          selectedDate={selectedDate}
          isLoading={isLoading}
          onSelectDay={(date) => setSelectedDate({ date, items: applyFilters(getItemsForDate(allItems, date), filterType, watchFilter, watchedEpisodeKeys) })}
        />
      )}

      {viewMode === "week" && (
        <CalendarWeekGrid
          weekDays={getWeekDays(selectedDate.date, allItems, filterType, watchFilter, watchedEpisodeKeys)}
          today={today}
          selectedDate={selectedDate}
          isLoading={isLoading}
          onSelectDay={(date) => setSelectedDate({ date, items: applyFilters(getItemsForDate(allItems, date), filterType, watchFilter, watchedEpisodeKeys) })}
        />
      )}

      {viewMode !== "day" && (
        <CalendarDayDetail
          containerRef={episodeListRef}
          selectedDate={selectedDate}
          watchedEpisodeKeys={watchedEpisodeKeys}
          onMarkWatched={handleEpisodeWatched}
        />
      )}

      {viewMode === "day" && (
        <CalendarDayDetail
          containerRef={episodeListRef}
          selectedDate={selectedDate}
          watchedEpisodeKeys={watchedEpisodeKeys}
          onMarkWatched={handleEpisodeWatched}
          headingSize="xl"
        />
      )}

      <CalendarSyncModal isOpen={showSyncModal} onClose={() => setShowSyncModal(false)} />
    </div>
  );
}
