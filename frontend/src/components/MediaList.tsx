// // src/components/MediaList.tsx
// import { BASE_IMAGE_URL } from "../constants";
// import { firebaseApp } from "../firebase";
// import { getAuth } from "firebase/auth";
// import { API_URL } from "../constants";
// import { Link } from "react-router-dom";
// import { Movie, Show, Person } from "../types/calendar";
// import { useState } from "react";
// import WatchButton from "./WatchButton";

// interface MediaListProps {
//   items: Array<Movie | Show | Person>;
//   type: "movie" | "tv" | "person";
// }

// const INITIAL_COUNT = 5;

// const known_for_to_job: Record<string, string> = {
//   Acting: "Actor",
//   Production: "Producer",
//   Directing: "Director",
//   Art: "Artist",
//   Writing: "Writer",
//   Sound: "Sound",
//   "Visual Effects": "Visual Effects",
// };

// export default function MediaList({ items, type }: MediaListProps) {
//   console.log(items);
//   if (items.length === 0)
//     return <p className="text-gray-500">No items found.</p>;

//   const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);
//   const visibleItems = items.slice(0, visibleCount);
//   const hasMore = items.length > visibleCount;
//   const auth = getAuth(firebaseApp);

//   async function addToUser(item: Movie | Show) {
//     if (type == "person") return;

//     const user = auth.currentUser;
//     if (!user) {
//       alert("You must be signed in to add a show.");
//       return;
//     }

//     try {
//       // Call your backend endpoint to add to the watchlist
//       const res = await fetch(`${API_URL}/watchlist/add`, {
//         method: "POST",
//         headers: {
//           Authorization: `Bearer ${await auth.currentUser?.getIdToken()}`,
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           content_type: type, // or "movie" depending on the type
//           content_id: item.id,
//         }),
//       });

//       if (!res.ok) {
//         const text = await res.text();
//         console.error("Backend add failed:", text);
//         alert("Failed to add show. See console for details.");
//         return;
//       }
//     } catch (err) {
//       console.error("Error adding show:", err);
//       alert("Failed to add show. See console for details.");
//     }
//   }
//   if (items.length === 0)
//     return <p className="text-gray-500">No items found.</p>;

//   return (
//     <div className="flex flex-col gap-4">
//       {visibleItems.map((item) => {
//         const isPerson = type === "person";
//         const isMedia = type === "tv" || type === "movie";

//         let imageSrc: string;
//         if (isPerson) {
//           const person = item as Person;
//           imageSrc = person.profile_path
//             ? `${BASE_IMAGE_URL}/w154${person.profile_path}`
//             : "/src/assets/person-icon.png";
//         } else {
//           const media = item as Movie | Show;
//           imageSrc = media.poster_path
//             ? `${BASE_IMAGE_URL}/w154${media.poster_path}`
//             : "/src/assets/movie-icon.png";
//         }

//         const title = "name" in item ? item.name : item.title;

//         return (
//           <div
//             key={item.id}
//             className="flex gap-4 items-start p-2 border-b justify-between"
//           >
//             <div className="flex gap-4 items-start">
//               <img
//                 src={imageSrc}
//                 alt={title}
//                 className="w-24 h-auto rounded-md object-cover"
//               />

//               <div className="flex flex-col">
//                 <Link
//                   to={
//                     type === "tv"
//                       ? `/tv/${item.id}`
//                       : type === "movie"
//                         ? `/movie/${item.id}`
//                         : `/person/${item.id}`
//                   }
//                 >
//                   <div className="font-semibold text-gray-900">
//                     {"name" in item ? item.name : item.title}
//                   </div>
//                 </Link>
//                 {isMedia && (
//                   <div className="text-gray-700 text-sm mt-1">
//                     {(item as Movie | Show).overview ||
//                       "No overview available."}
//                   </div>
//                 )}
//                 {isPerson && (
//                   <div className="text-gray-700 text-sm mt-1">
//                     {known_for_to_job[(item as Person).known_for_department] ??
//                       "Other"}
//                   </div>
//                 )}
//                 {"release_date" in item && (
//                   <div className="text-gray-500 text-xs mt-1">
//                     Release Date: {item.release_date}
//                   </div>
//                 )}
//               </div>
//               {isMedia && (
//                 <button
//                   onClick={() => addToUser(item as Movie | Show)}
//                   className="text-white bg-indigo-600 hover:bg-indigo-500 rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg"
//                 >
//                   +
//                 </button>
//               )}
//             </div>
//           </div>
//         );
//       })}
//       {items.length > INITIAL_COUNT && (
//         <button
//           onClick={() =>
//             setVisibleCount((prev) =>
//               prev >= items.length ? INITIAL_COUNT : prev + INITIAL_COUNT
//             )
//           }
//           className="self-start text-indigo-600 hover:text-indigo-500 font-medium mt-2"
//         >
//           {visibleCount >= items.length ? "Show less" : "Show more"}
//         </button>
//       )}
//     </div>
//   );
// }

// src/components/MediaList.tsx
import { BASE_IMAGE_URL } from "../constants";
import { Link } from "react-router-dom";
import { Movie, Show, Person } from "../types/calendar";
import { useState } from "react";
import WatchButton from "./WatchButton";

interface MediaListProps {
  results: {
    movies?: Movie[];
    shows?: Show[];
    people?: Person[];
  };
}

const INITIAL_COUNT = 5;

const known_for_to_job: Record<string, string> = {
  Acting: "Actor",
  Production: "Producer",
  Directing: "Director",
  Art: "Artist",
  Writing: "Writer",
  Sound: "Sound",
  "Visual Effects": "Visual Effects",
};

export default function MediaList({ results }: MediaListProps) {
  const [visibleCounts, setVisibleCounts] = useState<Record<string, number>>(
    {}
  );

  const movies = results.movies ?? [];
  const shows = results.shows ?? [];
  const people = results.people ?? [];

  const sections = [
    { key: "Movies", items: movies, type: "movie" },
    { key: "TV Shows", items: shows, type: "tv" },
    { key: "People", items: people, type: "person" },
  ].filter((s) => s.items.length > 0); // only keep sections that have items

  sections.sort((a, b) => {
    const aPopularity = a.items[0]?.popularity ?? 0;
    const bPopularity = b.items[0]?.popularity ?? 0;
    return bPopularity - aPopularity; // descending
  });

  const isEmpty =
    movies.length === 0 && shows.length === 0 && people.length === 0;

  if (isEmpty) {
    return (
      <div className="text-gray-500 text-center py-8">Nothing here yet.</div>
    );
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-us");
  };
  return (
    <div className="flex flex-col gap-6">
      {sections.map((section) => {
        const visibleCount = visibleCounts[section.key] ?? INITIAL_COUNT;
        return (
          <div key={section.key}>
            <h2 className="text-xl font-semibold mb-2">{section.key}</h2>
            <div className="flex flex-col gap-4">
              {section.items.slice(0, visibleCount).map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[96px_1fr_auto] gap-4 items-start p-3 border-b"
                >
                  <img
                    src={
                      "poster_path" in item
                        ? item.poster_path
                          ? `${BASE_IMAGE_URL}/w154${item.poster_path}`
                          : "/src/assets/movie-icon.png"
                        : item.profile_path
                          ? `${BASE_IMAGE_URL}/w154${item.profile_path}`
                          : "/src/assets/person-icon.png"
                    }
                    alt={"title" in item ? item.title : item.name}
                    className="w-24 h-auto rounded-md object-cover"
                  />
                  <div className="flex flex-col">
                    <Link
                      to={
                        section.type === "movie"
                          ? `/movie/${item.id}`
                          : section.type === "tv"
                            ? `/tv/${item.id}`
                            : `/person/${item.id}`
                      }
                    >
                      <div className="font-semibold text-gray-900">
                        {"title" in item ? item.title : item.name}
                      </div>
                    </Link>
                    {"overview" in item && (
                      <div className="text-gray-700 text-sm mt-1">
                        {item.overview || "No overview available."}
                      </div>
                    )}
                    {"release_date" in item && (
                      <div className="text-gray-500 text-xs mt-1">
                        Release Date: {formatDate(item.release_date)}
                      </div>
                    )}
                    {"known_for_department" in item && (
                      <div className="text-gray-700 text-sm mt-1">
                        {known_for_to_job[item.known_for_department] ?? "Other"}
                      </div>
                    )}
                  </div>
                  {section.type !== "person" && (
                    <WatchButton
                      contentType={section.type}
                      contentId={item.id}
                    />
                  )}
                </div>
              ))}
              {section.items.length > INITIAL_COUNT && (
                <button
                  onClick={() => {
                    setVisibleCounts((prev) => ({
                      ...prev,
                      [section.key]:
                        visibleCount >= section.items.length
                          ? INITIAL_COUNT
                          : visibleCount + INITIAL_COUNT,
                    }));
                  }}
                  className="self-start text-indigo-600 hover:text-indigo-500 font-medium mt-2"
                >
                  {visibleCount >= section.items.length
                    ? "Show less"
                    : "Show more"}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  // return (
  //   <div className="flex flex-col gap-6">
  //     {movies && movies.length > 0 && (
  //       <div key="Movies">
  //         <h2 className="text-xl font-semibold mb-2">Movies</h2>
  //         <div className="flex flex-col gap-4">
  //           {movies.slice(0, visibleCount).map((item) => {
  //             return (
  //               <div
  //                 key={item.id}
  //                 className="flex gap-4 items-start p-2 border-b justify-between"
  //               >
  //                 <div className="flex gap-4 items-start">
  //                   <img
  //                     src={
  //                       item.poster_path
  //                         ? `${BASE_IMAGE_URL}/w154${item.poster_path}`
  //                         : "/src/assets/movie-icon.png"
  //                     }
  //                     alt={item.title}
  //                     className="w-24 h-auto rounded-md object-cover"
  //                   />
  //                   <div className="flex flex-col">
  //                     <Link to={`/movie/${item.id}`}>
  //                       <div className="font-semibold text-gray-900">
  //                         {item.title}
  //                       </div>
  //                     </Link>
  //                     <div className="text-gray-700 text-sm mt-1">
  //                       {item.overview || "No overview available."}
  //                     </div>
  //                     <div className="text-gray-500 text-xs mt-1">
  //                       Release Date: {item.release_date}
  //                     </div>
  //                   </div>
  //                   <WatchButton contentType="movie" contentId={item.id} />
  //                 </div>
  //               </div>
  //             );
  //           })}
  //           {movies.length > INITIAL_COUNT && (
  //             <button
  //               onClick={() =>
  //                 setVisibleCount((prev) =>
  //                   prev >= movies.length ? INITIAL_COUNT : prev + INITIAL_COUNT
  //                 )
  //               }
  //               className="self-start text-indigo-600 hover:text-indigo-500 font-medium mt-2"
  //             >
  //               {visibleCount >= movies.length ? "Show less" : "Show more"}
  //             </button>
  //           )}
  //         </div>
  //       </div>
  //     )}

  //     {shows && shows.length > 0 && (
  //       <div key="TV Shows">
  //         <h2 className="text-xl font-semibold mb-2">TV Shows</h2>
  //         <div className="flex flex-col gap-4">
  //           {shows.slice(0, visibleCount).map((item) => {
  //             return (
  //               <div
  //                 key={item.id}
  //                 className="flex gap-4 items-start p-2 border-b justify-between"
  //               >
  //                 <div className="flex gap-4 items-start">
  //                   <img
  //                     src={
  //                       item.poster_path
  //                         ? `${BASE_IMAGE_URL}/w154${item.poster_path}`
  //                         : "/src/assets/movie-icon.png"
  //                     }
  //                     alt={item.name}
  //                     className="w-24 h-auto rounded-md object-cover"
  //                   />
  //                   <div className="flex flex-col">
  //                     <Link to={`/tv/${item.id}`}>
  //                       <div className="font-semibold text-gray-900">
  //                         {item.name}
  //                       </div>
  //                     </Link>
  //                     <div className="text-gray-700 text-sm mt-1">
  //                       {item.overview || "No overview available."}
  //                     </div>
  //                   </div>
  //                   <WatchButton contentType="tv" contentId={item.id} />
  //                 </div>
  //               </div>
  //             );
  //           })}
  //           {shows.length > INITIAL_COUNT && (
  //             <button
  //               onClick={() =>
  //                 setVisibleCount((prev) =>
  //                   prev >= shows.length ? INITIAL_COUNT : prev + INITIAL_COUNT
  //                 )
  //               }
  //               className="self-start text-indigo-600 hover:text-indigo-500 font-medium mt-2"
  //             >
  //               {visibleCount >= shows.length ? "Show less" : "Show more"}
  //             </button>
  //           )}
  //         </div>
  //       </div>
  //     )}

  //     {people && people.length > 0 && (
  //       <div key="People">
  //         <h2 className="text-xl font-semibold mb-2">People</h2>
  //         <div className="flex flex-col gap-4">
  //           {people.slice(0, visibleCount).map((item) => {
  //             return (
  //               <div
  //                 key={item.id}
  //                 className="flex gap-4 items-start p-2 border-b justify-between"
  //               >
  //                 <div className="flex gap-4 items-start">
  //                   <img
  //                     src={
  //                       item.profile_path
  //                         ? `${BASE_IMAGE_URL}/w154${item.profile_path}`
  //                         : "/src/assets/person-icon.png"
  //                     }
  //                     alt={item.name}
  //                     className="w-24 h-auto rounded-md object-cover"
  //                   />
  //                   <div className="flex flex-col">
  //                     <Link to={`/person/${item.id}`}>
  //                       <div className="font-semibold text-gray-900">
  //                         {item.name}
  //                       </div>
  //                     </Link>
  //                     <div className="text-gray-700 text-sm mt-1">
  //                       {known_for_to_job[item.known_for_department] ?? "Other"}
  //                     </div>
  //                   </div>
  //                 </div>
  //               </div>
  //             );
  //           })}
  //           {people.length > INITIAL_COUNT && (
  //             <button
  //               onClick={() =>
  //                 setVisibleCount((prev) =>
  //                   prev >= people.length ? INITIAL_COUNT : prev + INITIAL_COUNT
  //                 )
  //               }
  //               className="self-start text-indigo-600 hover:text-indigo-500 font-medium mt-2"
  //             >
  //               {visibleCount >= people.length ? "Show less" : "Show more"}
  //             </button>
  //           )}
  //         </div>
  //       </div>
  //     )}
  //   </div>
  // );
}
