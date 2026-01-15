// src/pages/Watchlist.tsx
import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { firebaseApp } from "../firebase";
import { BASE_IMAGE_URL, API_URL } from "../constants";
import { useNavigate } from "react-router-dom";
import { CalendarData } from "../types/calendar";
import { FaPencilAlt } from "react-icons/fa";
import { Link } from "react-router-dom";
import WatchButton from "./WatchButton";

interface WatchlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  calendarData: CalendarData;
  setCalendarData: React.Dispatch<React.SetStateAction<CalendarData>>;
}

export default function WatchlistModal({
  isOpen,
  onClose,
  calendarData,
  setCalendarData,
}: WatchlistModalProps) {
  if (!isOpen) return null;

  const [filter, setFilter] = useState<"all" | "tv" | "movies">("all");
  const navigate = useNavigate();
  const auth = getAuth(firebaseApp);

  const showsToDisplay =
    filter === "all" || filter === "tv" ? calendarData.shows : [];
  const moviesToDisplay =
    filter === "all" || filter === "movies" ? calendarData.movies : [];

  // Remove a show from watchlist
  const handleRemove = async (contentType: "tv" | "movie", id: number) => {
    try {
      // Get the current user's token for authentication
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;

      // Call backend API to remove show
      const res = await fetch(`${API_URL}/watchlist/remove`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content_type: contentType,
          content_id: id,
        }),
      });

      if (!res.ok) {
        console.error(`Failed to remove show ${id} from watchlist`);
        return;
      }

      // Update local calendar data
      setCalendarData((prev) => ({
        ...prev,
        shows:
          contentType === "tv"
            ? prev.shows.filter((s) => s.show.id !== id)
            : prev.shows,
        movies:
          contentType === "movie"
            ? prev.movies.filter((m) => m.id !== id)
            : prev.movies,
      }));
    } catch (err) {
      console.error("Error removing show:", err);
    }
  };

  const handleAddShows = async () => {
    onClose();
    navigate("/search");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white w-11/12 md:w-2/3 max-h-[80vh] overflow-y-auto rounded-lg shadow-lg p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-xl font-bold"
        >
          &times;
        </button>
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">My Watchlist</h2>
          <button
            onClick={handleAddShows}
            className="ml-2 rounded-md bg-indigo-600 px-3 py-1 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Add Shows
          </button>
          <div>Filter: </div>
          <select
            value={filter}
            onChange={(e) =>
              setFilter(e.target.value as "all" | "tv" | "movies")
            }
            className="border px-2 py-1 rounded"
          >
            <option value="all">All</option>
            <option value="tv">Shows</option>
            <option value="movies">Movies</option>
          </select>
        </div>

        {showsToDisplay.length === 0 && moviesToDisplay.length === 0 ? (
          <p>Your watchlist is empty.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {showsToDisplay.map((showWithCal) => {
              const show = showWithCal.show;
              return (
                <div
                  key={`tv-${show.id}`}
                  className="flex gap-4 items-start p-4 border rounded-md shadow-sm relative"
                >
                  {show.poster_path && (
                    <img
                      src={`${BASE_IMAGE_URL}/w154${show.poster_path}`}
                      alt={show.name}
                      className="w-24 h-auto rounded-md object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex flex-col flex-1">
                    <div className="flex justify-between items-start">
                      <Link to={`/tv/${show.id}`}>
                        <h3 className="font-semibold text-lg">{show.name}</h3>
                      </Link>
                      <button
                        onClick={() => handleRemove("tv", show.id)}
                        className="text-red-600 hover:text-red-800 font-bold"
                      >
                        &times;
                      </button>
                    </div>
                    <p className="text-gray-700 text-sm mt-1">
                      {show.overview || "No overview available."}
                    </p>
                    <div className="text-gray-500 text-xs mt-1">
                      First air date: {show.first_air_date}
                    </div>
                  </div>
                </div>
              );
            })}

            {moviesToDisplay.map((movie) => (
              <div
                key={`movie-${movie.id}`}
                className="flex gap-4 items-start p-4 border rounded-md shadow-sm relative"
              >
                {movie.poster_path && (
                  <img
                    src={`${BASE_IMAGE_URL}/w154${movie.poster_path}`}
                    alt={movie.title}
                    className="w-24 h-auto rounded-md object-cover flex-shrink-0"
                  />
                )}
                <div className="flex flex-col flex-1">
                  <div className="flex justify-between items-start">
                    <Link to={`/movie/${movie.id}`}>
                      <h3 className="font-semibold text-lg">{movie.title}</h3>
                    </Link>
                    <button
                      onClick={() => handleRemove("movie", movie.id)}
                      className="text-red-600 hover:text-red-800 font-bold"
                    >
                      &times;
                    </button>
                  </div>
                  <p className="text-gray-700 text-sm mt-1">
                    {movie.overview || "No overview available."}
                  </p>
                  <div className="text-gray-500 text-xs mt-1">
                    Release date: {movie.release_date}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
