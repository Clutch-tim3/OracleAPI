const memCache = new Map<string, { value: string; expiresAt: number }>();

setInterval(() => {
  const now = Date.now();
  memCache.forEach((v, k) => { if (v.expiresAt < now) memCache.delete(k); });
}, 60_000);

export const cache = {
  async get(key: string): Promise<string | null> {
    const entry = memCache.get(key);
    if (!entry || entry.expiresAt < Date.now()) {
      memCache.delete(key);
      return null;
    }
    return entry.value;
  },

  async set(key: string, value: string, ttlSeconds = 300): Promise<void> {
    memCache.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  },

  async del(key: string): Promise<void> {
    memCache.delete(key);
  },

  isRedisAvailable(): boolean { return false; },
};
