// // src/pages/Search.tsx
// import { useEffect, useState } from "react";
// import { useLocation } from "react-router-dom";
// import type { Show, Movie, Person } from "../types/calendar";
// import { API_URL } from "../constants";
// import MediaList from "../components/MediaList";

// export default function Search() {
//   const location = useLocation();
//   const searchParams = new URLSearchParams(location.search);
//   const query = searchParams.get("q") || "";
//   const searchType = searchParams.get("type") || "all";

//   const [results, setResults] = useState<{
//     movies: Movie[];
//     shows: Show[];
//     people: Person[];
//   }>({
//     movies: [],
//     shows: [],
//     people: [],
//   });

//   // Fetch search results
//   useEffect(() => {
//     if (!query) {
//       setResults({ movies: [], shows: [], people: [] });
//       return;
//     }

//     async function fetchResults() {
//       try {
//         const params = new URLSearchParams();
//         params.append("query", query);
//         params.append("type", searchType);

//         const res = await fetch(`${API_URL}/search/?${params}`);
//         if (!res.ok) throw new Error("Failed to fetch search results");

//         const data = await res.json();

//         // Directly set the results
//         setResults({
//           movies: data.movies ?? [],
//           shows: data.shows ?? [],
//           people: data.people ?? [],
//         });
//       } catch (err) {
//         console.error(err);
//       }
//     }

//     fetchResults();
//   }, [query, searchType]);

//   const sections = [
//     {
//       key: "movie",
//       title: "Movies",
//       items: results.movies,
//       type: "movie" as const,
//     },
//     {
//       key: "tv",
//       title: "TV Shows",
//       items: results.shows,
//       type: "tv" as const,
//     },
//     {
//       key: "person",
//       title: "People",
//       items: results.people,
//       type: "person" as const,
//     },
//   ]
//     .filter((section) => section.items.length > 0)
//     .sort((a, b) => {
//       const aPopularity = a.items[0]?.popularity ?? 0;
//       const bPopularity = b.items[0]?.popularity ?? 0;
//       return bPopularity - aPopularity;
//     });

//   return (
//     <div className="p-6 max-w-3xl mx-auto">
//       <h1 className="text-2xl font-bold mb-4">Search</h1>

//       {sections.map((section) => (
//         <div key={section.key} className="mb-6">
//           <h2 className="text-xl font-semibold mb-2">{section.title}</h2>
//           <MediaList items={section.items} type={section.type} />
//         </div>
//       ))}
//     </div>
//   );
// }

// src/pages/Search.tsx
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import type { Show, Movie, Person } from "../types/calendar";
import { API_URL } from "../constants";
import MediaList from "../components/MediaList";

export default function Search() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const query = searchParams.get("q") || "";
  const searchType = searchParams.get("type") || "all";

  const [results, setResults] = useState<{
    movies: Movie[];
    shows: Show[];
    people: Person[];
  }>({
    movies: [],
    shows: [],
    people: [],
  });

  useEffect(() => {
    if (!query) {
      setResults({ movies: [], shows: [], people: [] });
      return;
    }

    async function fetchResults() {
      try {
        const params = new URLSearchParams();
        params.append("query", query);
        params.append("type", searchType);

        const res = await fetch(`${API_URL}/search?${params}`);
        if (!res.ok) throw new Error("Failed to fetch search results");

        const data = await res.json();
        setResults({
          movies: data.movies ?? [],
          shows: data.shows ?? [],
          people: data.people ?? [],
        });
      } catch (err) {
        console.error(err);
      }
    }

    fetchResults();
  }, [query, searchType]);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Search</h1>
      <MediaList results={results} />
    </div>
  );
}
