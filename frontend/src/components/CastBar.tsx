import { BASE_IMAGE_URL } from "../constants";
import { Link } from "react-router-dom";

interface CastBarProps {
  cast: Cast[];
}

type Cast = {
  id: number;
  name: string;
  profile_path: string;
  character: string;
};

export default function CastBar({ cast }: CastBarProps) {
  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-4">Cast</h2>
      <div className="flex overflow-x-auto gap-4 pb-2 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
        {cast.map((actor, index) => (
          <div
            key={index}
            className="flex-shrink-0 w-32 bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer"
            title={actor.character}
          >
            <Link to={`/person/${actor.id}`}>
              {actor.profile_path ? (
                <img
                  src={`${BASE_IMAGE_URL}/w185${actor.profile_path}`}
                  alt={actor.name}
                  className="w-32 h-40 object-cover rounded-t-lg"
                />
              ) : (
                <div className="w-32 h-40 bg-gray-200 rounded-t-lg flex items-center justify-center text-xs text-gray-500">
                  No Image
                </div>
              )}
              <div className="p-2 text-center">
                <p className="text-sm font-semibold truncate">{actor.name}</p>
                <p className="text-xs text-gray-500 truncate">
                  {actor.character}
                </p>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
