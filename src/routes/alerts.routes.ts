import { Router } from 'express';
import alertsController from '../controllers/alerts.controller';
import { validateApiKey, requireTier } from '../middleware/auth.middleware';
import { rateLimiterMiddleware as rateLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

// Register alert
router.post(
  '/register',
  validateApiKey,
  rateLimiter,
  requireTier('PRO'),
  alertsController.registerAlert
);

// Get alerts
router.get(
  '/',
  validateApiKey,
  rateLimiter,
  requireTier('PRO'),
  alertsController.getAlerts
);

// Update alert
router.put(
  '/:id',
  validateApiKey,
  rateLimiter,
  requireTier('PRO'),
  alertsController.updateAlert
);

// Delete alert
router.delete(
  '/:id',
  validateApiKey,
  rateLimiter,
  requireTier('PRO'),
  alertsController.deleteAlert
);

export default router;