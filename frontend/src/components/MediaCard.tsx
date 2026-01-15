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
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US");
  };

  const handleRemove = () => {
    if (!onRemove) return;

    onRemove(type, item.id);
  };

  return (
    <div className="rounded-lg overflow-hidden bg-[#1f3b4d] flex flex-col">
      {/* Image section */}
      <div className="relative aspect-video cursor-pointer group">
        <Link to={type === "tv" ? `/tv/${item.id}` : `/movie/${item.id}`}>
          {item.backdrop_path && (
            <img
              src={`${BASE_IMAGE_URL}/w780${item.backdrop_path}`}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-80"
            />
          )}
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative z-10 flex h-full items-center justify-center px-1">
            {item.logo_path ? (
              <img
                src={`${BASE_IMAGE_URL}/w300${item.logo_path}`}
                alt={type === "tv" ? item.name : item.title}
                className="max-h-10 object-contain"
              />
            ) : (
              <span className="text-white text-[10px] font-semibold text-center line-clamp-2">
                {type === "tv" ? item.name : item.title}
              </span>
            )}
          </div>
        </Link>
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between gap-2 px-[4%] py-3 bg-[#1f3b4d]">
        <div className="flex flex-col justify-center min-h-[3.5rem]">
          <div className="text-sm sm:text-base font-medium text-white line-clamp-2">
            {type === "tv" ? item.name : item.title}
          </div>
          <div className="text-xs sm:text-sm text-white/80">
            {type === "tv"
              ? formatDate(item.first_air_date)
              : formatDate(item.release_date)}
          </div>
        </div>
        <button
          onClick={handleRemove}
          className="shrink-0 bg-blue-700 px-3 py-1.5 text-xs sm:text-sm text-white rounded-md hover:opacity-80"
        >
          Remove
        </button>
      </div>
    </div>
  );
}
