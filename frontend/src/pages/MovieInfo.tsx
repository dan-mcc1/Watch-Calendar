import { useEffect, useState } from "react";
import { BASE_IMAGE_URL, API_URL } from "../constants";
import type { Movie } from "../types/calendar";
import { useParams } from "react-router-dom";
import WhereToWatch from "../components/WhereToWatch";
import CastBar from "../components/CastBar";
import { Link } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { firebaseApp } from "../firebase";
import WatchButton from "../components/WatchButton";
import { onAuthStateChanged } from "firebase/auth";

type FullMovieData = Movie & {
  created_by: {
    id: number;
    credit_id: string;
    name: string;
    profile_path: string | null;
  }[];
  credits: {
    cast: {
      id: number;
      name: string;
      profile_path: string;
      character: string;
    }[];
  };
  external_ids: {
    imdb_id: string;
    tvdb_id: string;
    wikidata_id: string;
    facebook_id: string;
    instagram_id: string;
    twitter_id: string;
  };
  recommendations: { results: Movie[] };
};

export default function MovieInfo() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [movie, setMovie] = useState<FullMovieData>();
  const auth = getAuth(firebaseApp);
  const [user, setUser] = useState(auth.currentUser);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-us");
  };
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, [auth]);

  useEffect(() => {
    async function getData() {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/movies/${id}/info`);
        if (!res.ok) throw new Error("Failed to fetch movie");
        const rawData = await res.json();

        // Transform "watch/providers" to top-level "providers"
        let data: FullMovieData;
        if (rawData["watch/providers"]["results"]["US"]) {
          data = {
            ...rawData,
            providers: rawData["watch/providers"]["results"]["US"] || null,
          };
        } else {
          data = rawData;
        }
        setMovie(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    getData();
  }, [id]);

  if (loading) return <p>Loading movie info...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!movie) return <p>Movie not found.</p>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">{movie.title}</h1>
      {movie.tagline && (
        <p className="italic text-gray-500 mb-4">{movie.tagline}</p>
      )}
      {user && <WatchButton contentType="movie" contentId={movie.id} />}

      {movie.genres && movie.genres.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {movie.genres.map((genre) => (
            <span
              key={genre.id}
              className="px-3 py-1 text-sm rounded-full bg-indigo-100 text-indigo-700"
            >
              {genre.name}
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6">
        {movie.poster_path && (
          <img
            src={`${BASE_IMAGE_URL}/w300${movie.poster_path}`}
            alt={movie.title}
            className="w-64 rounded-md object-cover"
          />
        )}

        <div className="flex-1">
          {movie.created_by && movie.created_by.length > 0 && (
            <p>
              <strong>Created By:</strong>{" "}
              {movie.created_by.map((m) => m.name).join(", ")}
            </p>
          )}
          <p className="mb-2">
            <strong>Overview:</strong> {movie.overview || "N/A"}
          </p>
          <p className="mb-2">
            <strong>Release Date:</strong>{" "}
            {formatDate(movie.release_date) || "N/A"}
          </p>
          <p className="mb-2">
            <strong>Runtime:</strong>{" "}
            {movie.runtime ? (
              <>
                {Math.floor(movie.runtime / 60) > 0 &&
                  `${Math.floor(movie.runtime / 60)}h `}
                {movie.runtime % 60 > 0 && `${movie.runtime % 60}m`}
              </>
            ) : (
              "N/A"
            )}
          </p>
          <p className="mb-2">
            <strong>Status:</strong> {movie.status}
          </p>
          <p className="mb-2">
            <strong>Budget:</strong> ${movie.budget.toLocaleString()}
          </p>
          <p className="mb-2">
            <strong>Revenue:</strong> ${movie.revenue.toLocaleString()}
          </p>
          {movie.homepage && (
            <p className="mb-2">
              <strong>Homepage:</strong>{" "}
              <a
                href={movie.homepage}
                target="_blank"
                className="text-blue-500 hover:underline"
              >
                {movie.homepage}
              </a>
            </p>
          )}

          {/* External Links */}
          {movie.external_ids && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-2">External Links</h2>
              <div className="flex flex-wrap gap-4">
                {movie.external_ids.imdb_id && (
                  <a
                    href={`https://www.imdb.com/title/${movie.external_ids.imdb_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    IMDb
                  </a>
                )}
                {movie.external_ids.tvdb_id && (
                  <a
                    href={`https://www.thetvdb.com/?id=${movie.external_ids.tvdb_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    TVDB
                  </a>
                )}
                {movie.external_ids.wikidata_id && (
                  <a
                    href={`https://www.wikidata.org/wiki/${movie.external_ids.wikidata_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    Wikidata
                  </a>
                )}
                {movie.external_ids.facebook_id && (
                  <a
                    href={`https://www.facebook.com/${movie.external_ids.facebook_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    Facebook
                  </a>
                )}
                {movie.external_ids.instagram_id && (
                  <a
                    href={`https://www.instagram.com/${movie.external_ids.instagram_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    Instagram
                  </a>
                )}
                {movie.external_ids.twitter_id && (
                  <a
                    href={`https://twitter.com/${movie.external_ids.twitter_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    Twitter
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      {movie.providers && <WhereToWatch providers={movie.providers} />}

      {movie.credits && movie.credits.cast.length > 0 && (
        <CastBar cast={movie.credits.cast} />
      )}

      {/* Recommendations */}
      {movie.recommendations && movie.recommendations.results.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-semibold mb-4">You Might Like These:</h2>
          <div className="flex gap-4 flex-wrap">
            {movie.recommendations.results.map((rec) => (
              <div
                key={rec.id}
                className="flex flex-col items-center gap-2 w-36"
              >
                <Link to={`/tv/${rec.id}`}>
                  {rec.poster_path ? (
                    <img
                      src={`${BASE_IMAGE_URL}/w300${rec.poster_path}`}
                      alt={rec.title}
                      className="w-36 h-auto rounded-md object-cover"
                    />
                  ) : (
                    <div className="w-36 h-52 bg-gray-200 rounded-md flex items-center justify-center">
                      <span className="text-gray-500 text-sm text-center">
                        No Image
                      </span>
                    </div>
                  )}

                  <span className="text-center font-medium">{rec.title}</span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
