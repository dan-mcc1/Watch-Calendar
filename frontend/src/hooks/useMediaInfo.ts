import { useState, useEffect } from "react";
import { useAuthUser } from "./useAuthUser";
import { apiFetch } from "../utils/apiFetch";
import { getCachedStatuses, mergeCachedStatuses } from "../utils/statusCache";
import type { WatchStatus } from "../components/WatchButton";
import type { ExternalScores, AggregateRating } from "../types/media";

interface UseMediaInfoOptions {
  contentType: "movie" | "tv";
  id: string | undefined;
  fetchUrl: string;
}

export interface UseMediaInfoResult<T> {
  data: T | undefined;
  loading: boolean;
  error: string | null;
  initialStatus: WatchStatus | undefined;
  initialRating: number | null | undefined;
  statusReady: boolean;
  externalScores: ExternalScores | null;
  aggRating: AggregateRating | null;
}

export function useMediaInfo<T extends { id: number; external_ids?: { imdb_id?: string } }>(
  options: UseMediaInfoOptions
): UseMediaInfoResult<T> {
  const { contentType, id, fetchUrl } = options;
  const user = useAuthUser();

  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialStatus, setInitialStatus] = useState<WatchStatus | undefined>(undefined);
  const [initialRating, setInitialRating] = useState<number | null | undefined>(undefined);
  const [statusReady, setStatusReady] = useState(false);
  const [externalScores, setExternalScores] = useState<ExternalScores | null>(null);
  const [aggRating, setAggRating] = useState<AggregateRating | null>(null);

  // Pattern 1: Reset on id change
  useEffect(() => {
    setData(undefined);
    setInitialStatus(undefined);
    setInitialRating(undefined);
    setStatusReady(false);
  }, [id]);

  // Pattern 2: Fetch watch status (after data loads)
  useEffect(() => {
    if (!user || !data) return;
    const items = [{ content_type: contentType, content_id: data.id }];
    const { cached, missing } = getCachedStatuses(user.uid, items);
    if (!missing.length) {
      setInitialStatus(cached[`${contentType}:${data.id}`]?.status as WatchStatus);
      setInitialRating(cached[`${contentType}:${data.id}`]?.rating ?? null);
      setStatusReady(true);
      return;
    }
    apiFetch("/watchlist/status/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(missing),
    })
      .then((r) => (r.ok ? r.json() : {}))
      .then((d: Record<string, { status: string; rating: number | null }>) => {
        mergeCachedStatuses(user.uid, d);
        setInitialStatus(d[`${contentType}:${data.id}`]?.status as WatchStatus);
        setInitialRating(d[`${contentType}:${data.id}`]?.rating ?? null);
      })
      .catch(() => {})
      .finally(() => setStatusReady(true));
  }, [user, data]);

  // Pattern 3: Fetch main data + parallel ratings
  useEffect(() => {
    if (!id) return;
    async function fetchData() {
      try {
        setLoading(true);
        const res = await apiFetch(fetchUrl);
        if (!res.ok) throw new Error("Failed to fetch");
        const rawData = await res.json();
        let parsed: T;
        if (rawData["watch/providers"]?.["results"]?.["US"]) {
          parsed = { ...rawData, providers: rawData["watch/providers"]["results"]["US"] };
        } else {
          parsed = rawData;
        }
        setData(parsed);
        // Parallel: aggregate ratings
        apiFetch(`/reviews/aggregate?content_type=${contentType}&content_id=${id}`)
          .then((r) => r.json())
          .then(setAggRating)
          .catch(() => {});
        // Parallel: external scores (only if imdb_id exists)
        const imdbId = parsed.external_ids?.imdb_id;
        if (imdbId) {
          apiFetch(`/reviews/external-scores?imdb_id=${encodeURIComponent(imdbId)}`)
            .then((r) => r.json())
            .then((scores) => Object.keys(scores).length > 0 && setExternalScores(scores))
            .catch(() => {});
        }
      } catch (err: any) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  return {
    data,
    loading,
    error,
    initialStatus,
    initialRating,
    statusReady,
    externalScores,
    aggRating,
  };
}
