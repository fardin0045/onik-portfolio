/**
 * Tiny in-process TTL cache for the public content payload.
 * Every admin write calls `invalidate()`. With several server instances each
 * instance's copy expires after TTL, so staleness is bounded (swap for Redis to share it).
 */
const TTL_MS = 60 * 1000;
const store = new Map();

export const cache = {
  get(key) {
    const hit = store.get(key);
    if (!hit) return undefined;
    if (hit.expires < Date.now()) {
      store.delete(key);
      return undefined;
    }
    return hit.value;
  },
  set(key, value, ttl = TTL_MS) {
    store.set(key, { value, expires: Date.now() + ttl });
    return value;
  },
  invalidate() {
    store.clear();
  },
};

/** Express middleware: clears the public cache after any successful mutating admin request. */
export function invalidateOnWrite(req, res, next) {
  if (req.method !== 'GET') {
    res.on('finish', () => {
      if (res.statusCode < 400) cache.invalidate();
    });
  }
  next();
}
