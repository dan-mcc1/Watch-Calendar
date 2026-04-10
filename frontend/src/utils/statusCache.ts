export interface StatusEntry {
  status: string;
  rating: number | null;
}

const TTL_MS = 5 * 60 * 1000; // 5 minutes

interface UserCache {
  entries: Map<string, StatusEntry>;
  cachedAt: number;
}

// uid -> UserCache
const cache = new Map<string, UserCache>();

function getUserCache(uid: string): UserCache | undefined {
  const uc = cache.get(uid);
  if (!uc) return undefined;
  if (Date.now() - uc.cachedAt > TTL_MS) {
    cache.delete(uid);
    return undefined;
  }
  return uc;
}

/** Returns which items are already cached and which still need to be fetched. */
export function getCachedStatuses(
  uid: string,
  items: { content_type: string; content_id: number }[],
): {
  cached: Record<string, StatusEntry>;
  missing: { content_type: string; content_id: number }[];
} {
  const userCache = getUserCache(uid);
  const cached: Record<string, StatusEntry> = {};
  const missing: { content_type: string; content_id: number }[] = [];
  for (const item of items) {
    const key = `${item.content_type}:${item.content_id}`;
    if (userCache?.entries.has(key)) {
      cached[key] = userCache.entries.get(key)!;
    } else {
      missing.push(item);
    }
  }
  return { cached, missing };
}

/** Merge a batch of fetched statuses into the cache. */
export function mergeCachedStatuses(uid: string, statuses: Record<string, StatusEntry>) {
  let uc = getUserCache(uid);
  if (!uc) {
    // Evict all other uids to prevent unbounded growth across sessions
    cache.clear();
    uc = { entries: new Map(), cachedAt: Date.now() };
    cache.set(uid, uc);
  }
  for (const [key, value] of Object.entries(statuses)) {
    uc.entries.set(key, value);
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
  let uc = getUserCache(uid);
  if (!uc) {
    uc = { entries: new Map(), cachedAt: Date.now() };
    cache.set(uid, uc);
  }
  uc.entries.set(`${type}:${id}`, { status, rating });
}

export function clearStatusCache() {
  cache.clear();
}
