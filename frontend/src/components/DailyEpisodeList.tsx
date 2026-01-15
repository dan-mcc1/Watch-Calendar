import type { Episode, Movie } from "../types/calendar";
import { BASE_IMAGE_URL } from "../constants";
import { Link } from "react-router-dom";

export type CalendarItem =
  | (Episode & { type: "tv" }) // episodes from shows
  | {
      id: number;
      title: string;
      poster_path: string | null;
      overview: string;
      release_date: string;
      bg_color?: string;
      showData: Movie;
      type: "movie";
      runtime: number;
    }; // movies

interface DailyItemListProps {
  dailyItems: CalendarItem[];
}

export default function DailyEpisodeList({ dailyItems }: DailyItemListProps) {
  const showEpisodes = dailyItems.filter((e) => e.type === "tv") as (Episode & {
    type: "tv";
  })[];
  const movies = dailyItems.filter(
    (e) => e.type === "movie"
  ) as (CalendarItem & { type: "movie" })[];

  // Group show episodes without still_path
  const episodesWithStill = showEpisodes.filter((e) => e.still_path);
  const episodesWithoutStill = showEpisodes.filter((e) => !e.still_path);
  const groupedByShow: Record<string, (Episode & { type: "tv" })[]> = {};
  episodesWithoutStill.forEach((episode) => {
    const showId = episode.showData?.id;
    if (!showId) return;
    if (!groupedByShow[showId]) groupedByShow[showId] = [];
    groupedByShow[showId].push(episode);
  });

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-us");
  };

  return (
    <>
      {/* Render episodes with their own images */}
      {episodesWithStill.map((episode, idx) => (
        <div
          key={`single-${idx}`}
          className="flex gap-4 items-start p-2 border-b border-gray-200"
        >
          <img
            src={`${BASE_IMAGE_URL}/w500${episode.still_path}`}
            alt={episode.name}
            className="w-64 h-auto rounded-md object-cover flex-shrink-0"
          />

          <div className="flex flex-col">
            <Link to={`/tv/${episode.showData.id}`}>
              <div className="font-semibold text-gray-900">
                {episode.showData?.name} - S{episode.season_number}E
                {episode.episode_number} - {episode.name}
              </div>
            </Link>
            <div className="text-gray-700 text-sm mt-1">{episode.overview}</div>
            <div className="text-gray-500 text-xs mt-1">
              Air date: {formatDate(episode.air_date)} | Runtime:{" "}
              {episode.runtime ? (
                <>
                  {Math.floor(episode.runtime / 60) > 0 &&
                    `${Math.floor(episode.runtime / 60)}h `}
                  {episode.runtime % 60 > 0 && `${episode.runtime % 60}m`}
                </>
              ) : (
                "N/A"
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Render grouped episodes without still_path */}
      {Object.values(groupedByShow).map((episodes, idx) => {
        const show = episodes[0].showData;
        if (!show) return null;

        return (
          <div
            key={`group-${idx}`}
            className="flex gap-4 items-start p-2 border-b border-gray-200"
          >
            {/* Show poster */}
            <img
              src={`${BASE_IMAGE_URL}/w500${show.poster_path}`}
              alt={show.name}
              className="w-64 h-auto rounded-md object-cover flex-shrink-0"
            />

            {/* List of upcoming episodes */}
            <div className="flex flex-col gap-2">
              {episodes.map((episode, eIdx) => (
                <div key={eIdx}>
                  <Link to={`/tv/${episode.showData.id}`}>
                    <div className="font-semibold text-gray-900">
                      {show.name} - S{episode.season_number}E
                      {episode.episode_number} - {episode.name}
                    </div>
                  </Link>
                  <div className="text-gray-500 text-xs mt-1">
                    Air date: {formatDate(episode.air_date)} | Runtime:{" "}
                    {episode.runtime ? (
                      <>
                        {Math.floor(episode.runtime / 60) > 0 &&
                          `${Math.floor(episode.runtime / 60)}h `}
                        {episode.runtime % 60 > 0 && `${episode.runtime % 60}m`}
                      </>
                    ) : (
                      "N/A"
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {movies.map((movie) => (
        <div
          key={movie.id}
          className="flex gap-4 items-start p-2 border-b border-gray-200"
        >
          <img
            src={`${BASE_IMAGE_URL}/w500${movie.poster_path}`}
            alt={movie.title}
            className="w-64 h-auto rounded-md object-cover flex-shrink-0"
          />
          <div className="flex flex-col">
            <Link to={`/movie/${movie.id}`}>
              <div className="font-semibold text-gray-900">{movie.title}</div>
            </Link>
            <div className="text-gray-700 text-sm mt-1">{movie.overview}</div>
            <div className="text-gray-500 text-xs mt-1">
              Release date: {movie.release_date} | Runtime:{" "}
              {movie.runtime ? (
                <>
                  {Math.floor(movie.runtime / 60) > 0 &&
                    `${Math.floor(movie.runtime / 60)}h `}
                  {movie.runtime % 60 > 0 && `${movie.runtime % 60}m`}
                </>
              ) : (
                "N/A"
              )}
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
