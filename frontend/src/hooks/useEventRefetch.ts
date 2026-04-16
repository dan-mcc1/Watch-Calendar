import { useEffect } from "react";

export function useEventRefetch(eventName: string, fetchFn: () => void) {
  useEffect(() => {
    window.addEventListener(eventName, fetchFn);
    return () => window.removeEventListener(eventName, fetchFn);
  }, [eventName, fetchFn]);
}
