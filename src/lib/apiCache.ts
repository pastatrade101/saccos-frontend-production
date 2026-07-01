// Lightweight in-memory stale-while-revalidate (SWR) cache for read requests.
//
// cachedGet(key, fetcher, ttlMs, onRevalidate):
//   - fresh entry (age < ttl)  -> returns it immediately, no network
//   - stale entry (age >= ttl) -> returns the stale value immediately AND kicks off
//     a background refresh; onRevalidate(fresh) fires when the refresh lands so the
//     caller can patch state
//   - no entry                 -> fetches, caches, and resolves with the result
//   - concurrent calls for the same key share one in-flight request (dedup)
//
// Keys should encode everything that changes the result (endpoint + tenant + branch
// scope), so different scopes never read each other's data.

interface CacheEntry<T> {
    value: T;
    storedAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

function revalidate<T>(key: string, fetcher: () => Promise<T>, ttlMs: number): Promise<T> {
    const existing = inflight.get(key) as Promise<T> | undefined;
    if (existing) {
        return existing;
    }

    const request = fetcher()
        .then((value) => {
            store.set(key, { value, storedAt: Date.now() });
            return value;
        })
        .finally(() => {
            inflight.delete(key);
        });

    inflight.set(key, request);
    return request;
}

export async function cachedGet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlMs = 60_000,
    onRevalidate?: (value: T) => void
): Promise<T> {
    const entry = store.get(key) as CacheEntry<T> | undefined;

    if (entry) {
        const isFresh = Date.now() - entry.storedAt < ttlMs;
        if (isFresh) {
            return entry.value;
        }

        // Stale: serve immediately, refresh in the background, notify on success.
        void revalidate(key, fetcher, ttlMs)
            .then((value) => onRevalidate?.(value))
            .catch(() => {
                // Keep serving the stale value; the next read will retry.
            });
        return entry.value;
    }

    return revalidate(key, fetcher, ttlMs);
}

// Drop cached entries whose key starts with `prefix` (call after a mutation so the
// next read refetches). Pass no argument to clear everything.
export function invalidateCache(prefix?: string): void {
    if (!prefix) {
        store.clear();
        return;
    }
    for (const key of store.keys()) {
        if (key.startsWith(prefix)) {
            store.delete(key);
        }
    }
}
