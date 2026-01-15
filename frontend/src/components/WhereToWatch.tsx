import { Provider } from "../types/calendar";
import { BASE_IMAGE_URL } from "../constants";

interface WhereToWatchProps {
  providers: Provider;
}

export default function WhereToWatch({ providers }: WhereToWatchProps) {
  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-3">Where to Watch</h2>
      {providers.flatrate && (
        <div className="mb-4">
          <h3 className="font-medium mb-2">Streaming</h3>
          <div className="flex gap-4 flex-wrap">
            {providers.flatrate.map((p) => (
              <div
                key={p.provider_id}
                className="flex flex-col items-center gap-2"
                title={p.provider_name}
              >
                {p.logo_path && (
                  <img
                    src={`${BASE_IMAGE_URL}/w154${p.logo_path}`}
                    alt={p.provider_name}
                    className="h-20 w-20 rounded"
                  />
                )}
                <span className="text-sm">{p.provider_name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {providers.rent && (
        <div className="mb-4">
          <h3 className="font-medium mb-2">Rent</h3>
          <div className="flex gap-4 flex-wrap">
            {providers.rent.map((p) => (
              <img
                key={p.provider_id}
                src={`${BASE_IMAGE_URL}/w154${p.logo_path}`}
                alt={p.provider_name}
                className="h-20 w-20 rounded"
                title={p.provider_name}
              />
            ))}
          </div>
        </div>
      )}

      {providers.buy && (
        <div className="mb-4">
          <h3 className="font-medium mb-2">Buy</h3>
          <div className="flex gap-4 flex-wrap">
            {providers.buy.map((p) => (
              <img
                key={p.provider_id}
                src={`${BASE_IMAGE_URL}/w154${p.logo_path}`}
                alt={p.provider_name}
                className="h-20 w-20 rounded"
                title={p.provider_name}
              />
            ))}
          </div>
        </div>
      )}

      {providers.link && (
        <a
          href={providers.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-2 text-indigo-600 hover:underline text-sm"
        >
          View all options on TMDB →
        </a>
      )}
    </div>
  );
}
