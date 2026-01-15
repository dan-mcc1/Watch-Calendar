// import { API_URL, BASE_IMAGE_URL } from "../constants";
// import { Season, Episode, Show } from "../types/calendar";
// import { useState } from "react";

// type FullSeason = Season & { episodes: Episode[] };

// export default function SeasonInfo(showId: number, seasons: Season[]) {
//   const [expandedSeason, setExpandedSeason] = useState<FullSeason | null>(null);
//   const [loadingSeason, setLoadingSeason] = useState(false);

//   const toggleSeason = async (season: Season) => {
//     if (expandedSeason) {
//       setExpandedSeason(null);
//       return;
//     }
//     try {
//       setLoadingSeason(true);
//       const res = await fetch(
//         `${API_URL}/tv/${showId}/season/${season.season_number}/info`
//       );
//       if (!res.ok) throw new Error("Failed to fetch season info");
//       const data: FullSeason = await res.json();
//       setExpandedSeason(data);
//     } catch (err) {
//       console.error(err);
//       alert("Failed to fetch season info");
//     } finally {
//       setLoadingSeason(false);
//     }
//   };

//   return (
//     <div className="mt-6">
//       <h2 className="text-2xl font-semibold mb-2">Seasons</h2>
//       <div className="flex flex-col gap-4">
//         {seasons.map((season: Season) => {
//           return (
//             <div key={season.id} className="border rounded-md p-2">
//               <div className="flex items-start gap-4">
//                 {season.poster_path && (
//                   <img
//                     src={`${BASE_IMAGE_URL}/w154${season.poster_path}`}
//                     alt={season.name}
//                     className="w-24 h-auto rounded-md object-cover"
//                   />
//                 )}
//                 <div className="flex-1">
//                   <h3 className="font-semibold">{season.name}</h3>
//                   <p className="text-gray-500 text-sm">
//                     Air date: {season.air_date || "N/A"} | Episodes:{" "}
//                     {season.episode_count}
//                   </p>
//                 </div>
//                 <button
//                   onClick={toggleSeason(season)}
//                   className="ml-auto text-gray-500 hover:text-gray-700 focus:outline-none"
//                   title={expandedSeason ? "Collapse" : "Expand"}
//                 >
//                   {loadingSeason ? (
//                     <span>Loading...</span>
//                   ) : (
//                     <span
//                       className={`transition-transform ${expandedSeason ? "rotate-180" : ""}`}
//                     >
//                       ▼
//                     </span>
//                   )}
//                 </button>
//               </div>

//               {/* Expanded season info */}
//               {expandedSeason && (
//                 <div className="mt-4 pl-2 border-t border-gray-200">
//                   {expandedSeason.overview && (
//                     <p className="mb-2">{expandedSeason.overview}</p>
//                   )}
//                   {expandedSeason.episodes && (
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
//                       {expandedSeason.episodes.map((ep) => (
//                         <div key={ep.id} className="flex gap-2 items-start">
//                           {ep.still_path && (
//                             <img
//                               src={`${BASE_IMAGE_URL}/w92${ep.still_path}`}
//                               alt={ep.name}
//                               className="w-20 h-auto rounded-md object-cover"
//                             />
//                           )}
//                           <div>
//                             <p className="font-medium">
//                               {ep.episode_number}. {ep.name}
//                             </p>
//                             <p className="text-gray-500 text-sm">
//                               {ep.air_date}
//                             </p>
//                             <p className="text-sm">{ep.overview}</p>
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   )}
//                 </div>
//               )}
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// }

import { API_URL, BASE_IMAGE_URL } from "../constants";
import { Season, Episode, Show } from "../types/calendar";
import { useState } from "react";

type FullSeason = Season & { episodes?: Episode[] };

interface SeasonInfoProps {
  showId: number;
  seasons: Season[];
}

export default function SeasonInfo({ showId, seasons }: SeasonInfoProps) {
  const [expandedSeasons, setExpandedSeasons] = useState<
    Record<number, FullSeason | null>
  >({});
  const [loadingSeasons, setLoadingSeasons] = useState<Record<number, boolean>>(
    {}
  );

  const toggleSeason = async (season: Season) => {
    if (expandedSeasons[season.season_number]) {
      // Collapse
      setExpandedSeasons((prev) => ({ ...prev, [season.season_number]: null }));
      return;
    }

    try {
      setLoadingSeasons((prev) => ({ ...prev, [season.season_number]: true }));
      const res = await fetch(
        `${API_URL}/tv/${showId}/season/${season.season_number}/info`
      );
      if (!res.ok) throw new Error("Failed to fetch season info");
      const data: FullSeason = await res.json();
      setExpandedSeasons((prev) => ({ ...prev, [season.season_number]: data }));
    } catch (err) {
      console.error(err);
      alert("Failed to fetch season info");
    } finally {
      setLoadingSeasons((prev) => ({ ...prev, [season.season_number]: false }));
    }
  };

  return (
    <div className="mt-6">
      <h2 className="text-2xl font-semibold mb-2">Seasons</h2>
      <div className="flex flex-col gap-4">
        {seasons.map((season: Season) => {
          const expandedSeason = expandedSeasons[season.season_number];
          const loadingSeason = loadingSeasons[season.season_number];

          return (
            <div key={season.id} className="border rounded-md p-2">
              <div className="flex items-start gap-4">
                {season.poster_path && (
                  <img
                    src={`${BASE_IMAGE_URL}/w154${season.poster_path}`}
                    alt={season.name}
                    className="w-24 h-auto rounded-md object-cover"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold">{season.name}</h3>
                  <p className="text-gray-500 text-sm">
                    Air date: {season.air_date || "N/A"} | Episodes:{" "}
                    {season.episode_count}
                  </p>
                </div>
                <button
                  onClick={() => toggleSeason(season)}
                  className="ml-auto text-gray-500 hover:text-gray-700 focus:outline-none"
                  title={expandedSeason ? "Collapse" : "Expand"}
                >
                  {loadingSeason ? (
                    <span>Loading...</span>
                  ) : (
                    <span
                      className={`transition-transform ${expandedSeason ? "rotate-180" : ""}`}
                    >
                      ▼
                    </span>
                  )}
                </button>
              </div>

              {/* Expanded season info */}
              {expandedSeason && (
                <div className="mt-4 pl-2 border-t border-gray-200">
                  {expandedSeason.overview && (
                    <p className="mb-2">{expandedSeason.overview}</p>
                  )}
                  {expandedSeason.episodes && (
                    <div className="grid grid-cols-1 gap-2">
                      {expandedSeason.episodes.map((ep) => (
                        <div key={ep.id} className="flex gap-2 items-start">
                          {ep.still_path && (
                            <img
                              src={`${BASE_IMAGE_URL}/w300${ep.still_path}`}
                              alt={ep.name}
                              className="w-40 h-auto rounded-md object-cover"
                            />
                          )}
                          <div>
                            <p className="font-medium">
                              {ep.episode_number}. {ep.name}
                            </p>
                            <p className="text-gray-500 text-sm">
                              {ep.air_date} | Runtime:{" "}
                              {ep.runtime ? (
                                <>
                                  {Math.floor(ep.runtime / 60) > 0 &&
                                    `${Math.floor(ep.runtime / 60)}h `}
                                  {ep.runtime % 60 > 0 && `${ep.runtime % 60}m`}
                                </>
                              ) : (
                                "N/A"
                              )}
                            </p>
                            <p className="text-sm">{ep.overview}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
