import { cache } from './cache';
import { Request, Response, NextFunction } from 'express';

interface RateWindow {
  count:     number;
  windowStart: number;
}

// In-memory fallback when Redis is absent
const memWindows = new Map<string, RateWindow>();

function getMemLimit(key: string, limit: number, windowMs: number): boolean {
  const now    = Date.now();
  const entry  = memWindows.get(key);
  if (!entry || now - entry.windowStart > windowMs) {
    memWindows.set(key, { count: 1, windowStart: now });
    return true; // allowed
  }
  if (entry.count >= limit) return false; // blocked
  entry.count++;
  return true; // allowed
}

export function rateLimiter(options: {
  windowMs:      number;  // e.g. 60_000 for 1 minute
  max:           number;  // requests per window
  keyFn?:        (req: Request) => string;
  skipOnNoRedis?: boolean; // if true, skip rate limiting when Redis absent
}) {
  const {
    windowMs,
    max,
    keyFn = (req) => req.headers['x-rapidapi-user'] as string || req.ip || 'anon',
    skipOnNoRedis = false,
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    const key      = `rl:${keyFn(req)}`;
    const windowSec = Math.floor(windowMs / 1000);

    // Try Redis first
    if (cache.isRedisAvailable()) {
      try {
        const raw   = await cache.get(key);
        const count = raw ? parseInt(raw, 10) : 0;
        if (count >= max) {
          res.set('X-RateLimit-Limit',     String(max));
          res.set('X-RateLimit-Remaining', '0');
          res.set('Retry-After',           String(windowSec));
          return res.status(429).json({
            error: 'rate_limit_exceeded',
            message: `Too many requests. Limit: ${max} per ${windowSec}s.`,
            retryAfter: windowSec,
          });
        }
        await cache.set(key, String(count + 1), windowSec);
        res.set('X-RateLimit-Limit',     String(max));
        res.set('X-RateLimit-Remaining', String(max - count - 1));
        return next();
      } catch { /* fall through to memory */ }
    }

    // In-memory fallback
    if (skipOnNoRedis) return next();
    const allowed = getMemLimit(key, max, windowMs);
    if (!allowed) {
      return res.status(429).json({
        error: 'rate_limit_exceeded',
        message: `Too many requests. Limit: ${max} per ${Math.floor(windowMs / 1000)}s.`,
      });
    }
    next();
  };
}