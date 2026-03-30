import { Request, Response, NextFunction } from 'express';
import { rateLimiter } from '../lib/rateLimiter';

// Tier-based rate limits (requests per second)
const TIER_LIMITS: Record<string, { max: number; windowMs: number }> = {
  FREE: {
    max: 2,
    windowMs: 1000
  },
  BASIC: {
    max: 5,
    windowMs: 1000
  },
  PRO: {
    max: 20,
    windowMs: 1000
  },
  ENTERPRISE: {
    max: 100,
    windowMs: 1000
  }
};

// Create rate limiter middleware for each tier
const rateLimiters: Record<string, ReturnType<typeof rateLimiter>> = {} as Record<string, ReturnType<typeof rateLimiter>>;

Object.keys(TIER_LIMITS).forEach(tier => {
  const { max, windowMs } = TIER_LIMITS[tier];
  rateLimiters[tier] = rateLimiter({
    windowMs,
    max,
    keyFn: (req) => {
      // Use API key hash if available, otherwise fall back to IP or RapidAPI user
      const apiKeyHash = (req as any).apiKeyHash;
      if (apiKeyHash) return apiKeyHash;
      
      // For RapidAPI compatibility
      const rapidApiUser = req.headers['x-rapidapi-user'];
      if (rapidApiUser) return rapidApiUser as string;
      
      // Fallback to IP
      return req.ip || req.connection.remoteAddress || 'anon';
    }
  });
});

// Export the middleware function
export const rateLimiterMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const tier = (req as any).apiKeyTier || 'FREE';
  const limiter = rateLimiters[tier] || rateLimiters.FREE;
  return limiter(req, res, next);
};