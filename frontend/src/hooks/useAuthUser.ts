import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../firebase";

/**
 * Returns the currently signed-in Firebase user, kept in sync via
 * onAuthStateChanged. Returns null while auth is initializing or when
 * signed out.
 *
 * Usage:
 *   const user = useAuthUser();
 *   const token = await user?.getIdToken();
 */
export function useAuthUser(): User | null {
  const [user, setUser] = useState<User | null>(auth.currentUser);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return unsubscribe;
  }, []);

  return user;
}
