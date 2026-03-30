import { Router } from 'express';
import portfolioController from '../controllers/portfolio.controller';
import { validatePortfolioSimulation } from '../middleware/validation.middleware';
import { validateApiKey, requireTier } from '../middleware/auth.middleware';
import { rateLimiterMiddleware as rateLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

// Portfolio simulation
router.post(
  '/simulate',
  validateApiKey,
  rateLimiter,
  requireTier('BASIC'),
  validatePortfolioSimulation,
  portfolioController.simulatePortfolio
);

export default router;