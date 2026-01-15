import { useState, useEffect } from "react";
import type { Show, Movie, Episode, CalendarData } from "../types/calendar";
import "react-datepicker/dist/react-datepicker.css";
import WatchlistModal from "./WatchlistModal";
import { User } from "firebase/auth";
import DailyEpisodeList from "./DailyEpisodeList";
import { BASE_IMAGE_URL } from "../constants";

interface Day {
  date: Date;
  items?: CalendarItem[];
}

interface CalendarProps {
  calendarData: CalendarData;
  setCalendarData: React.Dispatch<React.SetStateAction<CalendarData>>;
  showWatchlist: boolean;
  setShowWatchlist: React.Dispatch<React.SetStateAction<boolean>>;
  user: User | null;
}

export type CalendarItem =
  | (Episode & { type: "tv"; showData: Show }) // episodes from shows
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

export default function CalendarComponent({
  calendarData = { shows: [], movies: [] },
  setCalendarData,
  showWatchlist = false,
  setShowWatchlist,
  user,
}: CalendarProps) {
  const allItems: CalendarItem[] = [
    ...calendarData.shows.flatMap((show) =>
      (show.episodes ?? []).map((ep) => ({
        ...ep,
        showData: show.show,
        type: "tv" as const,
      }))
    ),
    ...calendarData.movies.map((movie) => ({
      id: movie.id,
      title: movie.title,
      poster_path: movie.poster_path,
      overview: movie.overview,
      release_date: movie.release_date,
      bg_color: movie.bg_color,
      showData: movie,
      type: "movie" as const,
      air_date: movie.release_date, // optional, for calendar date lookup
      runtime: movie.runtime,
    })),
  ];

  const [filterType, setFilterType] = useState<"all" | "tv" | "movie">("all");
  const getFilteredItems = (items: CalendarItem[]) => {
    if (filterType === "all") return items;
    return items.filter((item) => item.type === filterType);
  };

  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [daysOfMonth, setDaysOfMonth] = useState<Day[]>([]);
  const [selectedDate, setSelectedDate] = useState<Day>({
    date: today,
    items: allItems,
  });

  function setItemsForDay(date: Date) {
    const isoDate = date.toISOString().split("T")[0];
    const itemsForDay = getFilteredItems(
      allItems.filter(
        (item) =>
          (item.type === "tv" && item.air_date === isoDate) ||
          (item.type === "movie" && item.release_date === isoDate)
      )
    );
    setSelectedDate({ date, items: itemsForDay });
  }

  const handleDateChange = (date: Date) => {
    setCurrentMonth(date.getMonth());
    setCurrentYear(date.getFullYear());

    setItemsForDay(date);
  };

  const handleGoToToday = () => {
    const todayDate = new Date();
    setCurrentMonth(todayDate.getMonth());
    setCurrentYear(todayDate.getFullYear());

    setItemsForDay(todayDate);
  };

  // Generate all days for the current month
  const getDaysInMonth = (month: number, year: number) => {
    const date = new Date(year, month, 1);
    const days: Day[] = [];
    while (date.getMonth() === month) {
      const isoDate = date.toISOString().split("T")[0];
      const todaysItems = getFilteredItems(
        allItems.filter(
          (item) =>
            (item.type === "tv" && item.air_date === isoDate) ||
            (item.type === "movie" && item.release_date === isoDate)
        )
      );
      days.push({ date: new Date(date), items: todaysItems });
      date.setDate(date.getDate() + 1);
    }
    return days;
  };

  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  useEffect(() => {
    setItemsForDay(today);
  }, [calendarData]);

  useEffect(() => {
    setDaysOfMonth(getDaysInMonth(currentMonth, currentYear));
  }, [currentMonth, currentYear, calendarData]);

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  //   const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayNames = [
    ["S", "un"],
    ["M", "on"],
    ["T", "ue"],
    ["W", "ed"],
    ["Th", "u"],
    ["F", "ri"],
    ["S", "at"],
  ];

  // // Index episodes by date for fast lookup
  // const episodesByDate: Record<string, { date: string; title?: string }[]> = {};
  // episodes.forEach((ep) => {
  //   const d = ep.air_date.split("T")[0];
  //   episodesByDate[d] ??= [];
  //   episodesByDate[d].push(ep);
  // });

  // Fill empty cells before first day of month
  const emptyCells = Array(firstDayOfWeek).fill(null);

  return (
    <div className="lg:flex lg:h-full lg:flex-col max-w-7xl mx-auto">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-gray-200 px-6 py-4 bg-white">
        {/* Left: Calendar title */}
        <div className="text-4xl font-semibold text-[#1f3b4d]">
          Watch Calendar
        </div>

        {/* Right: Today button */}
        <button
          onClick={handleGoToToday}
          className="rounded-md bg-blue-700 px-4 py-1.5 text-md font-semibold text-white hover:bg-indigo-500"
        >
          Go To Today
        </button>
      </header>

      {/* Media type filter bar */}
      {/* <div className="flex px-6 py-3 border-b border-gray-200 bg-gray-50">
        <div className="inline-flex overflow-hidden rounded-lg border border-gray-300 bg-white">
          {[
            { label: "All", value: "all" },
            { label: "Movies", value: "movie" },
            { label: "TV Shows", value: "tv" },
          ].map((btn, idx, arr) => {
            const isActive = filterType === btn.value;
            const isFirst = idx === 0;
            const isLast = idx === arr.length - 1;

            return (
              <button
                key={btn.value}
                onClick={() => {
                  setFilterType(btn.value as "all" | "movie" | "tv");
                  setItemsForDay(selectedDate.date);
                }}
                className={`
          px-5 py-2 text-sm font-medium transition
          ${isActive ? "bg-blue-700 text-white" : "text-gray-700 hover:bg-gray-100"}
          ${!isLast ? "border-r border-gray-300" : ""}
          ${isFirst ? "rounded-l-lg" : ""}
          ${isLast ? "rounded-r-lg" : ""}
        `}
              >
                {btn.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center">
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <div className="relative flex items-center rounded-md bg-white shadow-sm md:items-stretch">
              <button
                onClick={handlePrevMonth}
                type="button"
                className="flex h-9 w-12 items-center justify-center rounded-l-md border-y border-l border-gray-300 pr-1 text-gray-400 hover:text-gray-500 focus:relative md:w-9 md:pr-0 md:hover:bg-gray-50"
              >
                {"<"}
              </button>
              <button
                type="button"
                className="h-9 items-center border-y border-gray-300 px-3.5 text-sm font-semibold text-gray-900 hover:bg-gray-50 focus:relative flex"
              >
                {monthNames[currentMonth]} {currentYear}
              </button>
              <span className="relative -mx-px h-5 w-px bg-gray-300 md:hidden"></span>
              <button
                onClick={handleNextMonth}
                type="button"
                className="flex h-9 w-12 items-center justify-center rounded-r-md border-y border-r border-gray-300 pl-1 text-gray-400 hover:text-gray-500 focus:relative md:w-9 md:pl-0 md:hover:bg-gray-50"
              >
                {">"}
              </button>
            </div>
          </div>
        </div>
        <div className="md:ml-4 md:flex md:items-center">
          {user && (
            <>
              <button
                onClick={() => setShowWatchlist(true)}
                className="ml-2 rounded-md bg-indigo-600 px-3 py-1 text-sm font-semibold text-white hover:bg-indigo-500"
              >
                Watchlist
              </button>
              <WatchlistModal
                isOpen={showWatchlist}
                onClose={() => setShowWatchlist(false)}
                setCalendarData={setCalendarData}
                calendarData={calendarData}
              />
            </>
          )}
        </div>
      </div> */}

      <div className="relative flex items-center px-4 py-3 border-b border-gray-200 bg-gray-50">
        {/* LEFT: Filters */}
        <div className="flex items-center gap-2 lg:gap-4">
          {/* Full buttons for large screens */}
          <div>Filter:</div>
          <div className="hidden lg:inline-flex overflow-hidden rounded-lg border border-gray-300 bg-white">
            {["all", "movie", "tv"].map((value, idx, arr) => {
              const label =
                value === "all"
                  ? "All"
                  : value === "movie"
                    ? "Movies"
                    : "TV Shows";
              const isActive = filterType === value;
              const isFirst = idx === 0;
              const isLast = idx === arr.length - 1;
              return (
                <button
                  key={value}
                  onClick={() => {
                    setFilterType(value as "all" | "movie" | "tv");
                    setItemsForDay(selectedDate.date);
                  }}
                  className={`
              px-5 py-2 text-sm font-medium transition
              ${isActive ? "bg-blue-700 text-white" : "text-gray-700 hover:bg-gray-100"}
              ${!isLast ? "border-r border-gray-300" : ""}
              ${isFirst ? "rounded-l-lg" : ""}
              ${isLast ? "rounded-r-lg" : ""}
            `}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Dropdown for small screens */}
          <select
            className="lg:hidden border border-gray-300 rounded-md bg-white px-3 py-1 text-sm"
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value as "all" | "movie" | "tv");
              setItemsForDay(selectedDate.date);
            }}
          >
            <option value="all">All</option>
            <option value="movie">Movies</option>
            <option value="tv">TV Shows</option>
          </select>
        </div>

        {/* CENTER: Month selector */}
        <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-1 ">
          <button
            onClick={handlePrevMonth}
            className="h-9 w-9 flex items-center justify-center text-2xl rounded-l-md text-[#1f3b4d] hover:text-[#1f3b4d]/70"
          >
            {"<"}
          </button>
          <div className="h-9 px-3 flex items-center text-2xl text-[#1f3b4d] gap-2">
            <div className="font-semibold">{monthNames[currentMonth]}</div>
            <div>{currentYear}</div>
          </div>
          <button
            onClick={handleNextMonth}
            className="h-9 w-9 flex items-center justify-center text-2xl rounded-r-md text-[#1f3b4d] hover:text-[#1f3b4d]/70"
          >
            {">"}
          </button>
        </div>

        {/* RIGHT: Watchlist */}
        <div className="ml-auto flex items-center">
          {user && (
            <>
              <button
                onClick={() => setShowWatchlist(true)}
                className="rounded-md bg-blue-700 px-3 py-1 text-sm==md font-semibold text-white hover:bg-indigo-500"
              >
                View Watchlist
              </button>
              <WatchlistModal
                isOpen={showWatchlist}
                onClose={() => setShowWatchlist(false)}
                setCalendarData={setCalendarData}
                calendarData={calendarData}
              />
            </>
          )}
        </div>
      </div>

      <div className="shadow ring-opacity-5 lg:flex lg:flex-auto lg:flex-col">
        {/* Days of the week */}
        <div className="grid grid-cols-7 gap-px text-center text-md font-semibold leading-6 text-gray-700 lg:flex-none">
          {dayNames.map(([letter, full], i) => {
            return (
              <div key={i} className="flex justify-center bg-white py-2">
                <span>{letter}</span>
                <span className="sr-only sm:not-sr-only">{full}</span>
              </div>
            );
          })}
        </div>

        {/* Days grid */}
        <div className="flex ring-1 ring-black bg-gray-200 text-xs leading-6 text-gray-700 flex-auto">
          <div className="w-full grid grid-cols-7 grid-rows-* gap-0">
            {emptyCells.map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className="relative bg-gray-50 px-3 py-2 text-gray-500 min-h-[8rem] max-h-[16rem] overflow-y-auto border-1 border-solid"
              />
            ))}
            {daysOfMonth.map((day) => {
              const isToday = day.date.toDateString() === today.toDateString();
              const isoDate = day.date.toISOString().split("T")[0];
              const todaysItems = getFilteredItems(
                allItems.filter(
                  (item) =>
                    (item.type === "tv" && item.air_date === isoDate) ||
                    (item.type === "movie" && item.release_date === isoDate)
                )
              );
              return (
                <div
                  key={day.date.toISOString()}
                  onClick={() => {
                    setSelectedDate(day);
                  }}
                  className={`relative px-3 py-2 text-gray-500 min-h-[8rem] max-h-[16rem] overflow-y-auto border-1 border-solid ${
                    isToday
                      ? "bg-blue-700 text-white font-bold"
                      : selectedDate.date.toDateString() ===
                          day.date.toDateString()
                        ? "bg-indigo-100 border-2 border-blue-700"
                        : "bg-white"
                  }`}
                >
                  <time dateTime={isoDate}>{day.date.getDate()}</time>

                  {todaysItems.map((item, idx) => {
                    const isEpisode = "episode_number" in item;
                    const title =
                      "episode_number" in item
                        ? `${item.showData.name} - ${item.name}`
                        : item.title;

                    return (
                      <div
                        key={idx}
                        className="relative mt-1 h-16 rounded overflow-hidden cursor-pointer group"
                      >
                        {/* Backdrop */}
                        {item.showData.backdrop_path && (
                          <img
                            src={`${BASE_IMAGE_URL}/w780${item.showData.backdrop_path}`}
                            alt=""
                            className="absolute inset-0 h-full w-full object-cover opacity-80"
                          />
                        )}

                        {/* Dark overlay */}
                        <div className="absolute inset-0 bg-black/40" />

                        {/* Logo or fallback text */}
                        <div className="relative z-10 flex h-full items-center justify-center px-2">
                          {/* <div className="rounded-md bg-black/5 backdrop-blur-sm p-2"> */}
                          {item.showData.logo_path ? (
                            <img
                              src={`${BASE_IMAGE_URL}/w300${item.showData.logo_path}`}
                              alt={title}
                              className="max-h-10 object-contain"
                            />
                          ) : (
                            <span className="text-white text-[10px] font-semibold text-center line-clamp-2">
                              {title}
                            </span>
                          )}
                          {/* </div> */}
                        </div>
                      </div>
                    );

                    // if (isEpisode) {
                    //   // TV episode rendering
                    //   return (
                    //     <div
                    //       key={idx}
                    //       className="flex-auto truncate font-medium text-gray-900 group-hover:text-indigo-600"
                    //       style={{
                    //         backgroundColor:
                    //           item.showData.bg_color ?? "transparent",
                    //       }}
                    //     >
                    //       {item.showData.name} - {item.name}
                    //     </div>
                    //   );
                    // } else {
                    //   // Movie rendering
                    //   return (
                    //     <div
                    //       key={idx}
                    //       className="flex-auto truncate font-medium text-gray-900 group-hover:text-indigo-600"
                    //       style={{
                    //         backgroundColor:
                    //           item.showData.bg_color ?? "transparent",
                    //       }}
                    //     >
                    //       {item.title}
                    //     </div>
                    //   );
                    // }
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-4 mb-2 text-lg font-semibold text-gray-800">
        {selectedDate.date.toLocaleDateString(undefined, {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </div>

      <div className="flex flex-col gap-4 mt-2">
        {selectedDate.items && selectedDate.items.length > 0 ? (
          <DailyEpisodeList dailyItems={getFilteredItems(selectedDate.items)} />
        ) : (
          <div className="text-gray-500 italic">Nothing on this day.</div>
        )}
      </div>
    </div>
  );
}
