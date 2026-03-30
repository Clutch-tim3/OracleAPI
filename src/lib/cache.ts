import Redis from 'ioredis';

let client: Redis | null = null;
let redisAvailable = false;

// In-memory fallback cache (used when Redis is not available)
const memCache = new Map<string, { value: string; expiresAt: number }>();

async function getClient(): Promise<Redis | null> {
  if (client) return client;
  const url = process.env.REDIS_URL;
  if (!url) {
    if (!redisAvailable) console.log('[cache] No REDIS_URL set — using in-memory cache');
    return null;
  }
  try {
    client = new Redis(url);
    client.on('error', (err) => {
      console.warn('[cache] Redis error, falling back to memory:', err.message);
      client = null;
      redisAvailable = false;
    });
    // Test connection
    await client.ping();
    redisAvailable = true;
    console.log('[cache] Redis connected');
    return client;
  } catch (err: any) {
    console.warn('[cache] Redis unavailable, using in-memory cache:', err.message);
    client = null;
    redisAvailable = false;
    return null;
  }
}

// Purge expired entries from mem cache periodically
setInterval(() => {
  const now = Date.now();
  memCache.forEach((v, k) => {
    if (v.expiresAt < now) memCache.delete(k);
  });
}, 60_000);

export const cache = {
  async get(key: string): Promise<string | null> {
    const r = await getClient();
    if (r) {
      try {
        const value = await r.get(key);
        if (value === null) {
          return null;
        }
        return value;
      } catch { /* fall through */ }
    }
    const entry = memCache.get(key);
    if (!entry || entry.expiresAt < Date.now()) {
      memCache.delete(key);
      return null;
    }
    return entry.value;
  },

  async set(key: string, value: string, ttlSeconds = 300): Promise<void> {
    const r = await getClient();
    if (r) {
      try {
        await r.set(key, value, 'EX', ttlSeconds);
        return;
      } catch { /* fall through */ }
    }
    memCache.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  },

  async del(key: string): Promise<void> {
    const r = await getClient();
    if (r) { 
      try { 
        await r.del(key); 
      } catch { /* ignore */ } 
    }
    memCache.delete(key);
  },

  isRedisAvailable(): boolean { return redisAvailable; },
};