// Lightweight stale-while-revalidate (SWR) cache for read requests, backed by
// sessionStorage so it survives a full page refresh (an in-memory-only cache is
// wiped on reload, which is why a hard refresh felt uncached).
//
// cachedGet(key, fetcher, ttlMs, onRevalidate):
//   - fresh entry (age < ttl)  -> returns it immediately, no network
//   - stale entry (age >= ttl) -> returns the stale value immediately AND kicks off
//     a background refresh; onRevalidate(fresh) fires when the refresh lands so the
//     caller can patch state
//   - no entry                 -> fetches, caches, and resolves with the result
//   - concurrent calls for the same key share one in-flight request (dedup)
//
// After the first load, every subsequent load/refresh renders instantly from the
// persisted entry (stale-while-revalidate), so the 5-10s cold fetch is paid once.
//
// Keys should encode everything that changes the result (endpoint + tenant + branch
// scope), so different scopes never read each other's data.

interface CacheEntry<T> {
    value: T;
    storedAt: number;
}

const STORAGE_PREFIX = "swrcache:";

const memory = new Map<string, CacheEntry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

function readStored<T>(key: string): CacheEntry<T> | undefined {
    try {
        const raw = sessionStorage.getItem(STORAGE_PREFIX + key);
        return raw ? (JSON.parse(raw) as CacheEntry<T>) : undefined;
    } catch {
        return undefined;
    }
}

function writeStored<T>(key: string, entry: CacheEntry<T>): void {
    try {
        sessionStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(entry));
    } catch {
        // sessionStorage full or value not serializable — memory cache still works.
    }
}

function getEntry<T>(key: string): CacheEntry<T> | undefined {
    const inMemory = memory.get(key) as CacheEntry<T> | undefined;
    if (inMemory) {
        return inMemory;
    }
    const stored = readStored<T>(key);
    if (stored) {
        memory.set(key, stored); // hydrate memory from storage after a refresh
    }
    return stored;
}

function setEntry<T>(key: string, value: T): void {
    const entry: CacheEntry<T> = { value, storedAt: Date.now() };
    memory.set(key, entry);
    writeStored(key, entry);
}

function revalidate<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const existing = inflight.get(key) as Promise<T> | undefined;
    if (existing) {
        return existing;
    }

    const request = fetcher()
        .then((value) => {
            setEntry(key, value);
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
    const entry = getEntry<T>(key);

    if (entry) {
        const isFresh = Date.now() - entry.storedAt < ttlMs;
        if (isFresh) {
            return entry.value;
        }

        // Stale: serve immediately, refresh in the background, notify on success.
        void revalidate(key, fetcher)
            .then((value) => onRevalidate?.(value))
            .catch(() => {
                // Keep serving the stale value; the next read will retry.
            });
        return entry.value;
    }

    return revalidate(key, fetcher);
}

// Drop cached entries whose key starts with `prefix` (call after a mutation, or on
// sign-out). Pass no argument to clear everything.
export function invalidateCache(prefix?: string): void {
    const matches = (key: string) => !prefix || key.startsWith(prefix);

    for (const key of [...memory.keys()]) {
        if (matches(key)) {
            memory.delete(key);
        }
    }

    try {
        for (let i = sessionStorage.length - 1; i >= 0; i -= 1) {
            const storageKey = sessionStorage.key(i);
            if (storageKey && storageKey.startsWith(STORAGE_PREFIX) && matches(storageKey.slice(STORAGE_PREFIX.length))) {
                sessionStorage.removeItem(storageKey);
            }
        }
    } catch {
        // Ignore storage access errors.
    }
}
