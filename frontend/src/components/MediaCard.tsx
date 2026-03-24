import { Movie, Show } from "../types/calendar";
import { BASE_IMAGE_URL } from "../constants";
import { Link } from "react-router-dom";

type MediaCardProps =
  | {
      type: "movie";
      item: Movie;
      onRemove?: (type: "movie" | "tv", id: number) => void;
    }
  | {
      type: "tv";
      item: Show;
      onRemove?: (type: "movie" | "tv", id: number) => void;
    };

export default function MediaCard({ item, type, onRemove }: MediaCardProps) {
  const title = type === "tv" ? (item as Show).name : (item as Movie).title;
  const date = type === "tv" ? (item as Show).first_air_date : (item as Movie).release_date;
  const year = date ? new Date(date).getFullYear() : null;

  const genres: { id: number; name: string }[] = item.genres ?? [];

  return (
    <div className="group relative rounded-xl overflow-hidden bg-slate-800 border border-slate-700 hover:border-slate-500 transition-all duration-200 hover:shadow-xl hover:shadow-black/40 hover:-translate-y-0.5 flex flex-col">
      <Link to={type === "tv" ? `/tv/${item.id}` : `/movie/${item.id}`} className="flex flex-col flex-1">
        {/* Backdrop image */}
        <div className="relative aspect-video overflow-hidden">
          {item.backdrop_path ? (
            <img
              src={`${BASE_IMAGE_URL}/w780${item.backdrop_path}`}
              alt=""
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full bg-slate-700 flex items-center justify-center">
              <svg className="w-12 h-12 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-800 via-transparent to-transparent" />

          {/* Logo overlay */}
          {item.logo_path && (
            <div className="absolute bottom-2 left-0 right-0 flex justify-center px-3">
              <img
                src={`${BASE_IMAGE_URL}/w300${item.logo_path}`}
                alt={title}
                className="max-h-8 object-contain drop-shadow-lg"
              />
            </div>
          )}

          {/* Type badge */}
          <div className="absolute top-2 left-2">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full backdrop-blur-sm ${
              type === "tv"
                ? "bg-purple-600/70 text-purple-100"
                : "bg-amber-600/70 text-amber-100"
            }`}>
              {type === "tv" ? "TV" : "Movie"}
            </span>
          </div>
        </div>

        {/* Info bar */}
        <div className="px-3 py-3 flex flex-col gap-1 flex-1">
          {!item.logo_path && (
            <div className="font-semibold text-slate-100 line-clamp-1 group-hover:text-blue-300 transition-colors">
              {title}
            </div>
          )}
          {item.logo_path && (
            <div className="font-semibold text-slate-100 line-clamp-1 group-hover:text-blue-300 transition-colors">
              {title}
            </div>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            {year && (
              <span className="text-xs text-slate-400">{year}</span>
            )}
            {genres.slice(0, 2).map((g) => (
              <span key={g.id} className="text-xs text-slate-500 bg-slate-700/60 px-1.5 py-0.5 rounded">
                {g.name}
              </span>
            ))}
          </div>
        </div>
      </Link>

      {/* Remove button */}
      {onRemove && (
        <div className="px-3 pb-3">
          <button
            onClick={(e) => {
              e.preventDefault();
              onRemove(type, item.id);
            }}
            className="w-full py-1.5 text-xs font-medium text-slate-400 bg-slate-700/50 hover:bg-red-600/20 hover:text-red-400 border border-slate-600 hover:border-red-600/40 rounded-lg transition-all duration-150"
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}
