// src/pages/ShowPage.tsx
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { BASE_IMAGE_URL, API_URL } from "../constants";
import type { Show, Episode } from "../types/calendar";
import SeasonInfo from "../components/SeasonInfo";
import WhereToWatch from "../components/WhereToWatch";
import CastBar from "../components/CastBar";
import { Link } from "react-router-dom";
import WatchButton from "../components/WatchButton";
import { firebaseApp } from "../firebase";
import { getAuth, onAuthStateChanged } from "firebase/auth";

type FullShowData = Show & {
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
  recommendations: { results: Show[] };
};

export default function ShowInfo() {
  const { id } = useParams<{ id: string }>();
  const [show, setShow] = useState<FullShowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
    if (!id) return;

    async function fetchShow() {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/tv/${id}/full`);
        if (!res.ok) throw new Error("Failed to fetch show info");
        const rawData = await res.json();

        // Transform "watch/providers" to top-level "providers"
        let data: FullShowData;
        if (rawData["watch/providers"]["results"]["US"]) {
          data = {
            ...rawData,
            providers: rawData["watch/providers"]["results"]["US"] || null,
          };
        } else {
          data = rawData;
        }
        // const data: FullShowData = {
        //   ...rawData,
        //   providers: rawData["watch/providers"]["results"]["US"] || null,
        // };
        setShow(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    fetchShow();
  }, [id]);

  if (loading) return <p>Loading show info...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!show) return <p>Show not found.</p>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <h1 className="text-4xl font-bold mb-2">{show.name}</h1>
      {show.tagline && (
        <p className="italic text-gray-500 mb-4">{show.tagline}</p>
      )}

      {user && <WatchButton contentType="tv" contentId={show.id} />}

      {/* Genres */}
      {show.genres && show.genres.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {show.genres.map((genre) => (
            <span
              key={genre.id}
              className="px-3 py-1 text-sm rounded-full bg-indigo-100 text-indigo-700"
            >
              {genre.name}
            </span>
          ))}
        </div>
      )}

      {/* Main Info */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Poster */}
        {show.poster_path && (
          <img
            src={`${BASE_IMAGE_URL}/w300${show.poster_path}`}
            alt={show.name}
            className="w-64 rounded-md object-cover"
          />
        )}

        {/* Details */}
        <div className="flex-1 space-y-2">
          {show.created_by && show.created_by.length > 0 && (
            <p>
              <strong>Created By:</strong>{" "}
              {show.created_by.map((c) => c.name).join(", ")}
            </p>
          )}
          <p>
            <strong>Overview:</strong> {show.overview || "N/A"}
          </p>
          <p>
            <strong>First Air Date:</strong>{" "}
            {formatDate(show.first_air_date) || "N/A"}
          </p>
          <p>
            <strong>Last Air Date:</strong>{" "}
            {formatDate(show.last_air_date) || "N/A"}
          </p>
          <p>
            <strong>Status:</strong> {show.status}
          </p>
          <p>
            <strong>In Production:</strong> {show.in_production ? "Yes" : "No"}
          </p>
          <p>
            <strong>Seasons:</strong> {show.number_of_seasons}
          </p>
          <p>
            <strong>Episodes:</strong> {show.number_of_episodes}
          </p>
          {show.homepage && (
            <p>
              <strong>Homepage:</strong>{" "}
              <a
                href={show.homepage}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                {show.homepage}
              </a>
            </p>
          )}
        </div>
      </div>

      {/* Watch Providers */}
      {show.providers && <WhereToWatch providers={show.providers} />}

      {/* Cast */}
      {show.credits && show.credits.cast.length > 0 && (
        <CastBar cast={show.credits.cast} />
      )}

      {/* External Links */}
      {show.external_ids && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-2">External Links</h2>
          <div className="flex flex-wrap gap-4">
            {show.external_ids.imdb_id && (
              <a
                href={`https://www.imdb.com/title/${show.external_ids.imdb_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                IMDb
              </a>
            )}
            {show.external_ids.tvdb_id && (
              <a
                href={`https://www.thetvdb.com/?id=${show.external_ids.tvdb_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                TVDB
              </a>
            )}
            {show.external_ids.wikidata_id && (
              <a
                href={`https://www.wikidata.org/wiki/${show.external_ids.wikidata_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                Wikidata
              </a>
            )}
            {show.external_ids.facebook_id && (
              <a
                href={`https://www.facebook.com/${show.external_ids.facebook_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                Facebook
              </a>
            )}
            {show.external_ids.instagram_id && (
              <a
                href={`https://www.instagram.com/${show.external_ids.instagram_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                Instagram
              </a>
            )}
            {show.external_ids.twitter_id && (
              <a
                href={`https://twitter.com/${show.external_ids.twitter_id}`}
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

      {/* Seasons */}
      {show.seasons && show.seasons.length > 0 && (
        <SeasonInfo showId={show.id} seasons={show.seasons} />
      )}

      {/* Recommendations */}
      {show.recommendations && show.recommendations.results.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-semibold mb-4">You Might Like These:</h2>
          <div className="flex gap-4 flex-wrap">
            {show.recommendations.results.map((rec) => (
              <div
                key={rec.id}
                className="flex flex-col items-center gap-2 w-36"
              >
                <Link to={`/tv/${rec.id}`}>
                  {rec.poster_path ? (
                    <img
                      src={`${BASE_IMAGE_URL}/w300${rec.poster_path}`}
                      alt={rec.name}
                      className="w-36 h-auto rounded-md object-cover"
                    />
                  ) : (
                    <div className="w-36 h-52 bg-gray-200 rounded-md flex items-center justify-center">
                      <span className="text-gray-500 text-sm text-center">
                        No Image
                      </span>
                    </div>
                  )}

                  <span className="text-center font-medium">{rec.name}</span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
