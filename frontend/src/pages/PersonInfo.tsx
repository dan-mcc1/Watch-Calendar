import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { BASE_IMAGE_URL, API_URL } from "../constants";
import type { Movie, Show } from "../types/calendar";

type FullPersonData = {
  id: number;
  name: string;
  profile_path: string | null;
  biography: string;
  birthday: string | null;
  deathday: string | null;
  place_of_birth: string | null;
  known_for_department: string;
  external_ids: {
    imdb_id: string | null;
    facebook_id: string | null;
    instagram_id: string | null;
    twitter_id: string | null;
    wikidata_id: string | null;
  };
  movie_credits: {
    cast: Movie[];
    crew: Movie[];
  };
  tv_credits: {
    cast: Show[];
    crew: Show[];
  };
};

function CreditList({
  title,
  credits,
  limit = 12,
}: {
  title: string;
  credits: (Movie | Show)[];
  limit?: number;
}) {
  const [showAll, setShowAll] = useState(false);

  if (!credits || credits.length === 0) return null;

  const displayedCredits = showAll ? credits : credits.slice(0, limit);

  return (
    <div className="mb-6">
      <h2 className="text-2xl font-semibold mb-3">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {displayedCredits.map((item) => {
          const name = "title" in item ? item.title : item.name;
          const poster = item.poster_path || item.backdrop_path;
          const role = (item as any).character;

          return (
            <Link
              key={item.id}
              to={"title" in item ? `/movie/${item.id}` : `/tv/${item.id}`}
              className="group"
            >
              {poster ? (
                <img
                  src={`${BASE_IMAGE_URL}/w300${poster}`}
                  alt={name}
                  className="w-full rounded-md object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-gray-200 rounded-md flex items-center justify-center">
                  <span className="text-gray-500 text-sm text-center">
                    {name}
                  </span>
                </div>
              )}
              <p className="text-sm mt-1 text-center font-medium">{name}</p>
              {role && (
                <p className="text-xs text-gray-500 text-center truncate">
                  {role}
                </p>
              )}
            </Link>
          );
        })}
      </div>

      {credits.length > limit && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-2 text-blue-500 hover:underline"
        >
          {showAll ? "Show Less" : `Show More (${credits.length - limit} more)`}
        </button>
      )}
    </div>
  );
}

export default function PersonInfo() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [person, setPerson] = useState<FullPersonData | null>(null);

  useEffect(() => {
    async function getData() {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/person/${id}/info`);
        if (!res.ok) throw new Error("Failed to fetch person");
        const rawData = await res.json();
        setPerson(rawData);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    getData();
  }, [id]);

  if (loading) return <p>Loading person info...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!person) return <p>Person not found.</p>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row gap-6 mb-6">
        {person.profile_path && (
          <img
            src={`${BASE_IMAGE_URL}/w300${person.profile_path}`}
            alt={person.name}
            className="w-64 rounded-md object-cover"
          />
        )}
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-2">{person.name}</h1>
          {person.known_for_department && (
            <p className="mb-2">
              <strong>Known for:</strong> {person.known_for_department}
            </p>
          )}
          {person.biography && (
            <p className="mb-2">
              <strong>Biography:</strong> {person.biography}
            </p>
          )}
          {person.birthday && (
            <p className="mb-1">
              <strong>Birthday:</strong> {person.birthday}
            </p>
          )}
          {person.deathday && (
            <p className="mb-1">
              <strong>Died:</strong> {person.deathday}
            </p>
          )}
          {person.place_of_birth && (
            <p className="mb-1">
              <strong>Place of Birth:</strong> {person.place_of_birth}
            </p>
          )}
          {person.external_ids && (
            <div className="mt-2 flex gap-4 flex-wrap">
              {person.external_ids.imdb_id && (
                <a
                  href={`https://www.imdb.com/name/${person.external_ids.imdb_id}`}
                  target="_blank"
                  className="text-blue-500 hover:underline"
                >
                  IMDb
                </a>
              )}
              {person.external_ids.facebook_id && (
                <a
                  href={`https://www.facebook.com/${person.external_ids.facebook_id}`}
                  target="_blank"
                  className="text-blue-500 hover:underline"
                >
                  Facebook
                </a>
              )}
              {person.external_ids.instagram_id && (
                <a
                  href={`https://www.instagram.com/${person.external_ids.instagram_id}`}
                  target="_blank"
                  className="text-blue-500 hover:underline"
                >
                  Instagram
                </a>
              )}
              {person.external_ids.twitter_id && (
                <a
                  href={`https://twitter.com/${person.external_ids.twitter_id}`}
                  target="_blank"
                  className="text-blue-500 hover:underline"
                >
                  Twitter
                </a>
              )}
              {person.external_ids.wikidata_id && (
                <a
                  href={`https://www.wikidata.org/wiki/${person.external_ids.wikidata_id}`}
                  target="_blank"
                  className="text-blue-500 hover:underline"
                >
                  Wikidata
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Credits */}
      <CreditList title="Movies" credits={person.movie_credits.cast} />
      <CreditList title="TV Shows" credits={person.tv_credits.cast} />
    </div>
  );
}
