import { Router } from 'express';
import marketsController from '../controllers/markets.controller';
import { validateMarketQuery, validateAnalysisRequest } from '../middleware/validation.middleware';
import { validateApiKey, requireTier } from '../middleware/auth.middleware';
import { rateLimiterMiddleware as rateLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

// All markets endpoint
router.get(
  '/',
  validateApiKey,
  rateLimiter,
  validateMarketQuery,
  marketsController.getAllMarkets
);

// Single market detail
router.get(
  '/:id',
  validateApiKey,
  rateLimiter,
  marketsController.getMarketById
);

// Market analysis
router.post(
  '/:id/analyse',
  validateApiKey,
  rateLimiter,
  requireTier('PRO'),
  validateAnalysisRequest,
  marketsController.analyzeMarket
);

// Trending markets
router.get(
  '/trending',
  validateApiKey,
  rateLimiter,
  requireTier('BASIC'),
  marketsController.getTrendingMarkets
);

// Consensus view
router.get(
  '/consensus',
  validateApiKey,
  rateLimiter,
  requireTier('BASIC'),
  marketsController.getConsensus
);

// Semantic search
router.get(
  '/search/semantic',
  validateApiKey,
  rateLimiter,
  requireTier('PRO'),
  marketsController.searchMarkets
);

// Market comparison
router.get(
  '/compare',
  validateApiKey,
  rateLimiter,
  requireTier('PRO'),
  marketsController.getMarketComparison
);

// Resolved markets
router.get(
  '/resolved',
  validateApiKey,
  rateLimiter,
  requireTier('BASIC'),
  marketsController.getResolvedMarkets
);

export default router;