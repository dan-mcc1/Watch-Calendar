export interface StatusEntry {
  status: string;
  rating: number | null;
}

// uid -> "type:id" -> StatusEntry
const cache = new Map<string, Map<string, StatusEntry>>();

/** Returns which items are already cached and which still need to be fetched. */
export function getCachedStatuses(
  uid: string,
  items: { content_type: string; content_id: number }[],
): {
  cached: Record<string, StatusEntry>;
  missing: { content_type: string; content_id: number }[];
} {
  const userCache = cache.get(uid);
  const cached: Record<string, StatusEntry> = {};
  const missing: { content_type: string; content_id: number }[] = [];
  for (const item of items) {
    const key = `${item.content_type}:${item.content_id}`;
    if (userCache?.has(key)) {
      cached[key] = userCache.get(key)!;
    } else {
      missing.push(item);
    }
  }
  return { cached, missing };
}

/** Merge a batch of fetched statuses into the cache. */
export function mergeCachedStatuses(uid: string, statuses: Record<string, StatusEntry>) {
  if (!cache.has(uid)) cache.set(uid, new Map());
  const userCache = cache.get(uid)!;
  for (const [key, value] of Object.entries(statuses)) {
    userCache.set(key, value);
  }
}

/** Update a single item's status after a WatchButton action. */
export function updateCachedStatus(
  uid: string,
  type: string,
  id: number,
  status: string,
  rating: number | null,
) {
  if (!cache.has(uid)) cache.set(uid, new Map());
  cache.get(uid)!.set(`${type}:${id}`, { status, rating });
}

export function clearStatusCache() {
  cache.clear();
}
