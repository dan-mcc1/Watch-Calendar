import { useState, useEffect } from "react";
import {
  getAuth,
  onAuthStateChanged,
  deleteUser,
  signOut,
} from "firebase/auth";
import { firebaseApp } from "../firebase";
import { useNavigate } from "react-router-dom";

export default function Settings() {
  const auth = getAuth(firebaseApp);
  const [user, setUser] = useState(auth.currentUser);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  const handleDelete = async () => {
    setError(null);

    if (!user) return;

    try {
      await deleteUser(user);
      navigate("/signIn");
    } catch (err: any) {
      console.error("Error deleting account:", err);

      // Firebase requires re-auth sometimes
      if (err.code === "auth/requires-recent-login") {
        setError(
          "Please log out and log back in before deleting your account.",
        );
      } else {
        setError(err.message);
      }
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    navigate("/");
  };

  if (!user) {
    return (
      <div className="p-6 text-center text-gray-600">
        You must be signed in to view this page.
      </div>
    );
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>

      <div className="bg-slate-800 shadow-md rounded-lg p-4 space-y-4">
        <div>
          <p className="text-gray-500 font-medium">Logged in as:</p>
          <p className="text-white font-semibold">{user.email}</p>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded">{error}</div>
        )}

        <button
          onClick={handleSignOut}
          className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg"
        >
          Sign Out
        </button>

        <button
          onClick={handleDelete}
          className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg"
        >
          Delete Account
        </button>
      </div>
    </div>
  );
}
