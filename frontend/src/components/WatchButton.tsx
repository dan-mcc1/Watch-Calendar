import { useState, useEffect, useRef } from "react";
import { getAuth, User } from "firebase/auth";
import { firebaseApp } from "../firebase";
import { API_URL } from "../constants";

export type WatchStatus = "none" | "Want To Watch" | "Watched";

interface WatchButtonProps {
  contentType: "movie" | "tv";
  contentId: number;
}

export default function WatchButton({
  contentType,
  contentId,
}: WatchButtonProps) {
  const auth = getAuth(firebaseApp);
  const [watchStatus, setWatchStatus] = useState<WatchStatus>("none");
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchStatus(user);
      } else {
        setWatchStatus("none");
        setStatusLoading(false);
      }
    });

    return unsubscribe;
  }, [contentId]); // refetch if contentId changes

  async function fetchStatus(user: User) {
    try {
      setStatusLoading(true);
      const res = await fetch(
        `${API_URL}/watchlist/${contentType}/${contentId}/status`,
        {
          headers: { Authorization: `Bearer ${await user.getIdToken()}` },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch watch status");
      const data = await res.json();
      setWatchStatus(data.status);
    } catch (err) {
      console.error(err);
    } finally {
      setStatusLoading(false);
    }
  }

  function getPrimaryLabel() {
    switch (watchStatus) {
      case "Watched":
        return "Watched";
      case "Want To Watch":
        return "On Watchlist";
      default:
        return "Want to Watch";
    }
  }

  async function updateWatchStatus(targetStatus: WatchStatus) {
    const user = auth.currentUser;
    if (!user) {
      alert("You must be signed in.");
      return;
    }

    try {
      setSaving(true);
      console.log("Changing status");

      if (watchStatus === "Want To Watch") {
        if (targetStatus === "Want To Watch") return;
        // Remove from watchlist
        await fetch(`${API_URL}/watchlist/remove`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${await user.getIdToken()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content_type: contentType,
            content_id: contentId,
          }),
        });
        if (targetStatus === "Watched") {
          await fetch(`${API_URL}/watched/add`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${await user.getIdToken()}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              content_type: contentType,
              content_id: contentId,
            }),
          });
        }
      } else if (watchStatus === "Watched") {
        if (targetStatus === "Watched") return;
        // Remove from watched
        await fetch(`${API_URL}/watched/remove`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${await user.getIdToken()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content_type: contentType,
            content_id: contentId,
          }),
        });

        if (targetStatus === "Want To Watch") {
          await fetch(`${API_URL}/watchlist/add`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${await user.getIdToken()}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              content_type: contentType,
              content_id: contentId,
            }),
          });
        }
      } else {
        if (targetStatus === "Want To Watch") {
          await fetch(`${API_URL}/watchlist/add`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${await user.getIdToken()}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              content_type: contentType,
              content_id: contentId,
            }),
          });
        } else if (targetStatus === "Watched") {
          await fetch(`${API_URL}/watched/add`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${await user.getIdToken()}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              content_type: contentType,
              content_id: contentId,
            }),
          });
        }
      }

      // Update state
      setWatchStatus(targetStatus);
      setMenuOpen(false);
    } catch (err) {
      console.error(err);
      alert("Failed to update watchlist/watched");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="relative inline-flex mb-6" ref={dropdownRef}>
      {/* Main button */}
      <button
        disabled={saving}
        onClick={() =>
          watchStatus === "none"
            ? updateWatchStatus("Want To Watch")
            : setMenuOpen((o) => !o)
        }
        className={`px-4 py-2 font-medium rounded-l-md disabled:opacity-50 ${
          watchStatus === "none"
            ? "bg-indigo-600 text-white hover:bg-indigo-500"
            : "bg-white text-gray-800 hover:bg-gray-100 border"
        }`}
      >
        {statusLoading ? "Loading..." : getPrimaryLabel()}
      </button>

      {/* Dropdown toggle */}
      <button
        disabled={saving}
        onClick={() => setMenuOpen((o) => !o)}
        className="px-2 py-2 bg-indigo-600 text-white rounded-r-md hover:bg-indigo-500 border-l border-indigo-500"
      >
        ▼
      </button>

      {/* Dropdown menu */}
      {menuOpen && (
        <div className="absolute left-0 top-full mt-1 w-48 bg-white border rounded-md shadow-lg z-20">
          {watchStatus !== "Want To Watch" && (
            <button
              onClick={() => updateWatchStatus("Want To Watch")}
              className="block w-full text-left px-4 py-2 hover:bg-gray-100"
            >
              Want to Watch
            </button>
          )}

          {watchStatus !== "Watched" && (
            <button
              onClick={() => updateWatchStatus("Watched")}
              className="block w-full text-left px-4 py-2 hover:bg-gray-100"
            >
              Watched
            </button>
          )}

          {watchStatus == "Watched" && (
            <>
              <div className="border-t my-1" />
              <button
                onClick={() => updateWatchStatus("none")}
                className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
              >
                Remove from Watched
              </button>
            </>
          )}
          {watchStatus == "Want To Watch" && (
            <>
              <div className="border-t my-1" />
              <button
                onClick={() => updateWatchStatus("none")}
                className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
              >
                Remove from Watchlist
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
