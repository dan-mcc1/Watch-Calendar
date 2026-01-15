import React, { useState } from "react";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../constants";

const SignIn: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // LOGIN
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      navigate("/");
    } catch (error) {
      console.error("Error logging in:", error);
    }
  };

  async function registerUserInBackend(uid: string, email: string | null) {
    try {
      const res = await fetch(`${API_URL}/user/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, email }),
      });

      if (!res.ok) {
        console.error("Backend registration failed: ", await res.text());
      }
    } catch (err) {
      console.error("Error registering user in backend");
    }
  }

  // REGISTER
  const handleRegister = async () => {
    setErrorMessage(null); // clear previous

    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      await registerUserInBackend(res.user.uid, res.user.email);
      navigate("/");
    } catch (err: any) {
      console.error("Error registering:", err);

      // Firebase-friendly message
      let msg = "Registration failed.";

      if (err.code === "auth/invalid-email") {
        msg = "Invalid email address.";
      } else if (err.code === "auth/weak-password") {
        msg = "Password should be at least 6 characters.";
      } else if (err.code === "auth/email-already-in-use") {
        msg = "Email is already in use.";
      } else if (err.message) {
        msg = err.message; // fallback
      }

      setErrorMessage(msg);
    }
  };

  // GOOGLE SIGN-IN
  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await registerUserInBackend(result.user.uid, result.user.email);
      navigate("/");
    } catch (error) {
      console.error("Google sign-in error:", error);
    }
  };

  return (
    <form
      onSubmit={handleLogin}
      className="flex flex-col flex-grow justify-center items-center space-y-4 h-full"
    >
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
        className="bg-[var(--primary-color)] text-[var(--secondary-color)] p-4 rounded-xl w-1/3"
      />

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
        className="bg-[var(--primary-color)] text-[var(--secondary-color)] p-4 rounded-xl w-1/3"
      />

      <button
        type="submit"
        className="bg-[var(--tertiary-color)] text-[var(--secondary-color)] py-[0.6em] px-[1.2em]"
      >
        Login
      </button>

      <button
        type="button"
        onClick={handleRegister}
        className="bg-blue-500 text-white py-[0.6em] px-[1.2em]"
      >
        Register
      </button>
      {errorMessage && (
        <div
          style={{
            marginTop: "10px",
            color: "red",
            background: "#ffe5e5",
            padding: "8px 12px",
            borderRadius: "6px",
            fontSize: "14px",
          }}
        >
          {errorMessage}
        </div>
      )}

      <button type="button" onClick={handleGoogleSignIn}>
        <svg
          className="w-6 h-6"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 533.5 544.3"
        >
          <path
            fill="#4285F4"
            d="M533.5 278.4c0-18.5-1.5-37-4.8-54.6H272.1v103.6h146.6c-6.3 33.5-25 61.9-53.6 80.8v67h86.8c50.8-46.8 80.6-115.6 80.6-196.8z"
          />
          <path
            fill="#34A853"
            d="M272.1 544.3c72.8 0 134-24.2 178.7-65.8l-86.8-67c-24.1 16.1-55.1 25.6-91.8 25.6-70.8 0-130.8-47.8-152.2-112.4h-89.3v70.6c44.4 88 135.4 149.9 241.5 149.9z"
          />
          <path
            fill="#FBBC05"
            d="M119.9 323.7c-10.7-31.8-10.7-66.4 0-98.2v-70.6h-89.3c-38.6 75-38.6 164.3 0 239.3l89.3-70.5z"
          />
          <path
            fill="#EA4335"
            d="M272.1 107.7c39.6 0 75.3 13.6 103.3 40.1l77.3-77.3c-47.6-44.2-110.6-71.5-180.6-71.5-106 0-197.1 61.9-241.5 149.9l89.3 70.6c21.5-64.6 81.5-112.4 152.2-112.4z"
          />
        </svg>
      </button>
    </form>
  );
};

export default SignIn;
