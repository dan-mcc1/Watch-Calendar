import { useEffect } from "react";

/**
 * Sets document.title for the current page.
 * Pass a page-specific title to get "Title — Release Radar",
 * or nothing to get just "Release Radar".
 */
export function usePageTitle(title?: string | null) {
  useEffect(() => {
    document.title = title ? `${title} — Release Radar` : "Release Radar";
  }, [title]);
}
