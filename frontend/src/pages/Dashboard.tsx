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
  const [showWatchlist, setShowWatchlist] = useState(false);

  const auth = getAuth(firebaseApp);

  async function fetchUserTVWatchlist(): Promise<Show[]> {
    const token = await auth.currentUser?.getIdToken();
    if (!token) return [];

    const res = await fetch(`${API_URL}/watchlist/tv`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error("Failed to fetch watchlist");
    }

    const items = await res.json();
    // Maybe change to just tv shows later?
    return items;
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

  useEffect(() => {
    if (!user) {
      setCalendarData({ shows: [], movies: [] });
      return;
    }

    async function fetchAllCalendarDataFromUser() {
      setLoading(true);
      try {
        // 1️⃣ Get TV IDs from backend watchlist
        const tvWatchlist: Show[] = await fetchUserTVWatchlist();
        const movies: Movie[] = await fetchMovieCalendar();

        // 2️⃣ Fetch TV calendars (cached)
        const showResults = await Promise.all(
          tvWatchlist.map((item) => fetchShowCalendarCached(item))
        );

        setCalendarData({
          shows: showResults.filter(Boolean) as ShowWithCalendar[],
          movies,
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
