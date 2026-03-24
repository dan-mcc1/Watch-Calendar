import { useEffect, useState, cache } from "react";
import Calendar from "../components/Calendar";
import type {
  Show,
  ShowWithCalendar,
  CalendarData,
  Movie,
} from "../types/calendar";
import { API_URL } from "../constants";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { firebaseApp } from "../firebase";
import WatchlistModal from "../components/WatchlistModal";

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [CalendarData, setCalendarData] = useState<CalendarData>({
    shows: [],
    movies: [],
  });
  const [watchedEpisodeKeys, setWatchedEpisodeKeys] = useState<Set<string>>(new Set());
  const [showWatchlist, setShowWatchlist] = useState(false);

  const auth = getAuth(firebaseApp);

  async function fetchUserTVWatchlist(): Promise<Show[]> {
    const token = await auth.currentUser?.getIdToken();
    if (!token) return [];

    const res = await fetch(`${API_URL}/watchlist/tv`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error("Failed to fetch watchlist");
    return res.json();
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser); // null if not logged in
    });

    return () => unsubscribe(); // cleanup
  }, []);

  const fetchShowCalendarCached = cache(
    async (item: Show): Promise<ShowWithCalendar | null> => {
      const cacheKey = `tv-${item.id}`;
      const cached = localStorage.getItem(cacheKey);

      if (cached) {
        try {
          return JSON.parse(cached);
        } catch {
          localStorage.removeItem(cacheKey);
        }
      }
      try {
        const res = await fetch(`${API_URL}/tv/${item.id}/season_calendar`);
        if (!res.ok) throw new Error(`Failed to fetch show ${item.id}`);
        const episodes = await res.json();
        const data: ShowWithCalendar = { show: item, episodes };
        localStorage.setItem(cacheKey, JSON.stringify(data));
        return data;
      } catch (err) {
        console.error(`Error fetching show ${item.id}:`, err);
        return null;
      }
    }
  );

  async function fetchMovieCalendar(): Promise<Movie[]> {
    const token = await auth.currentUser?.getIdToken();
    if (!token) return [];

    const res = await fetch(`${API_URL}/watchlist/movie`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error("Failed to fetch movie watchlist");
    return res.json();
  }

  async function fetchWatchedMovies(): Promise<Movie[]> {
    const token = await auth.currentUser?.getIdToken();
    if (!token) return [];

    const res = await fetch(`${API_URL}/watched/movie`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) return [];
    return res.json();
  }

  async function fetchWatchedEpisodeKeys(): Promise<Set<string>> {
    const token = await auth.currentUser?.getIdToken();
    if (!token) return new Set();

    const res = await fetch(`${API_URL}/watched-episode/`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) return new Set();
    const data: { show_id: number; season_number: number; episode_number: number }[] =
      await res.json();
    return new Set(data.map((e) => `${e.show_id}_${e.season_number}_${e.episode_number}`));
  }

  useEffect(() => {
    if (!user) {
      setCalendarData({ shows: [], movies: [] });
      return;
    }

    async function fetchAllCalendarDataFromUser() {
      setLoading(true);
      try {
        const [tvWatchlist, watchlistMovies, watchedMovies, episodeKeys] =
          await Promise.all([
            fetchUserTVWatchlist(),
            fetchMovieCalendar(),
            fetchWatchedMovies(),
            fetchWatchedEpisodeKeys(),
          ]);

        // Merge watchlist + watched movies; watched movies take precedence
        const movieMap = new Map<number, Movie>();
        for (const m of watchlistMovies) movieMap.set(m.id, { ...m, isWatched: false });
        for (const m of watchedMovies) movieMap.set(m.id, { ...m, isWatched: true });

        const showResults = await Promise.all(
          tvWatchlist.map((item) => fetchShowCalendarCached(item))
        );

        setWatchedEpisodeKeys(episodeKeys);
        setCalendarData({
          shows: showResults.filter(Boolean) as ShowWithCalendar[],
          movies: Array.from(movieMap.values()),
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchAllCalendarDataFromUser();
  }, [user]);

  //   useEffect(() => {
  //     if (user === undefined) return;
  //     else setTvIds([251941, 200875]);

  //     async function fetchAllShows() {
  //       setLoading(true);

  //       try {
  //         // 2️⃣ Only after that, fetch each show's calendar
  //         const results = await Promise.all(
  //           tvIds.map((id) => fetchShowCalendarCached(id))
  //         );
  //         setAllShowData(results.filter(Boolean) as ShowData[]);
  //       } catch (err) {
  //         console.error(err);
  //       } finally {
  //         setLoading(false);
  //       }
  //     }

  //     fetchAllShows();
  //   }, []);

  return (
    <div>
      {!loading ? (
        <>
          <Calendar
            calendarData={CalendarData}
            setCalendarData={setCalendarData}
            showWatchlist={showWatchlist}
            setShowWatchlist={setShowWatchlist}
            user={user}
            watchedEpisodeKeys={watchedEpisodeKeys}
          />
          {/* {user && (
            <WatchlistModal
              isOpen={showWatchlist}
              onClose={() => setShowWatchlist(false)}
              allShowData={allShowData}
              setAllShowData={setAllShowData}
            />
          )} */}
        </>
      ) : (
        <p>Loading episodes...</p>
      )}
    </div>
  );
}
