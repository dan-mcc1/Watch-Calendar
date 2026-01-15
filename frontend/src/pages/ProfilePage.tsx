import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { firebaseApp } from "../firebase";
import { API_URL, BASE_IMAGE_URL } from "../constants";
import WatchButton from "../components/WatchButton";
import MediaList from "../components/MediaList";
import { Movie, Show } from "../types/calendar";
import { Link } from "react-router-dom";
import { onAuthStateChanged, User } from "firebase/auth";

const INITIAL_COUNT = 5;

export default function ProfilePage() {
  const auth = getAuth(firebaseApp);
  const [user, setUser] = useState(auth.currentUser);
  const [watchlist, setWatchlist] = useState<{
    movies: Movie[];
    shows: Show[];
  }>({ movies: [], shows: [] });
  const [watched, setWatched] = useState<{ movies: Movie[]; shows: Show[] }>({
    movies: [],
    shows: [],
  });
  const [loading, setLoading] = useState(true);

  // Fetch lists from API
  async function fetchLists(user: User) {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();

      const [watchlistRes, watchedRes] = await Promise.all([
        fetch(`${API_URL}/watchlist`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/watched`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const watchlistData = await watchlistRes.json();
      const watchedData = await watchedRes.json();

      setWatchlist(watchlistData);
      setWatched(watchedData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        fetchLists(firebaseUser);
      }
    });

    return () => unsubscribe(); // Cleanup on unmount
  }, []);

  if (!user) {
    return (
      <div className="p-8 text-center text-gray-400">
        You must be signed in to view your profile.
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* User Info */}
      <div className="flex items-center gap-6 bg-[#2d4e63] p-6 rounded-lg text-white">
        <img
          src={user.photoURL ?? "/src/assets/avatar-placeholder.png"}
          alt={user.displayName ?? "User Avatar"}
          className="w-24 h-24 rounded-full object-cover border-2 border-white/20"
        />
        <div>
          <h1 className="text-2xl font-bold">{user.displayName ?? "User"}</h1>
          <p className="text-gray-200">{user.email}</p>
          <p className="mt-1 text-sm">
            Joined on {user.metadata?.creationTime?.split("T")[0]}
          </p>
        </div>
      </div>

      {/* Stats / Lists */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Watchlist */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">Watchlist</h2>

          {/* Movies */}
          {watchlist.movies.length > 0 && (
            <div key="watchlist-movies">
              <h3 className="text-xl font-semibold mb-2">Movies</h3>
              <div className="flex gap-4 overflow-x-auto">
                {watchlist.movies.slice(0, 5).map((movie) => (
                  <div key={movie.id} className="flex-shrink-0 w-32">
                    <Link to={`/movie/${movie.id}`}>
                      <img
                        src={
                          movie.poster_path
                            ? `${BASE_IMAGE_URL}/w154${movie.poster_path}`
                            : "/src/assets/movie-icon.png"
                        }
                        alt={movie.title}
                        className="w-full h-auto rounded-md object-cover"
                      />
                      <p className="mt-1 text-sm font-medium text-gray-900 text-center">
                        {movie.title}
                      </p>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TV Shows */}
          {watchlist.shows.length > 0 && (
            <div key="watchlist-shows" className="mt-4">
              <h3 className="text-xl font-semibold mb-2">TV Shows</h3>
              <div className="flex gap-4 overflow-x-auto">
                {watchlist.shows.slice(0, 5).map((show) => (
                  <div key={show.id} className="flex-shrink-0 w-32">
                    <Link to={`/tv/${show.id}`}>
                      <img
                        src={
                          show.poster_path
                            ? `${BASE_IMAGE_URL}/w154${show.poster_path}`
                            : "/src/assets/tv-icon.png"
                        }
                        alt={show.name}
                        className="w-full h-auto rounded-md object-cover"
                      />
                      <p className="mt-1 text-sm font-medium text-gray-900 text-center">
                        {show.name}
                      </p>
                    </Link>
                  </div>
                ))}
              </div>
              <Link
                to="/watchlist"
                className="text-indigo-600 hover:text-indigo-500 font-medium mt-2 inline-block"
              >
                View full watchlist
              </Link>
            </div>
          )}
        </div>

        {/* Watched */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">Watched</h2>

          {/* Movies */}
          {watched.movies.length > 0 && (
            <div key="watched-movies">
              <h3 className="text-xl font-semibold mb-2">Movies</h3>
              <div className="flex gap-4 overflow-x-auto">
                {watched.movies.slice(0, 5).map((movie) => (
                  <div key={movie.id} className="flex-shrink-0 w-32">
                    <Link to={`/movie/${movie.id}`}>
                      <img
                        src={
                          movie.poster_path
                            ? `${BASE_IMAGE_URL}/w154${movie.poster_path}`
                            : "/src/assets/movie-icon.png"
                        }
                        alt={movie.title}
                        className="w-full h-auto rounded-md object-cover"
                      />
                      <p className="mt-1 text-sm font-medium text-gray-900 text-center">
                        {movie.title}
                      </p>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TV Shows */}
          {watched.shows.length > 0 && (
            <div key="watched-shows" className="mt-4">
              <h3 className="text-xl font-semibold mb-2">TV Shows</h3>
              <div className="flex gap-4 overflow-x-auto">
                {watched.shows.slice(0, 5).map((show) => (
                  <div key={show.id} className="flex-shrink-0 w-32">
                    <Link to={`/tv/${show.id}`}>
                      <img
                        src={
                          show.poster_path
                            ? `${BASE_IMAGE_URL}/w154${show.poster_path}`
                            : "/src/assets/tv-icon.png"
                        }
                        alt={show.name}
                        className="w-full h-auto rounded-md object-cover"
                      />
                      <p className="mt-1 text-sm font-medium text-gray-900 text-center">
                        {show.name}
                      </p>
                    </Link>
                  </div>
                ))}
              </div>
              <Link
                to="/watched"
                className="text-indigo-600 hover:text-indigo-500 font-medium mt-2 inline-block"
              >
                View full watched list
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
