import { Router } from 'express';
import healthController from '../controllers/health.controller';

const router = Router();

// Health check
router.get(
  '/',
  healthController.getHealth
);

// System status
router.get(
  '/status',
  healthController.getStatus
);

export default router;