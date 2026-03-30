import { Request, Response } from 'express';
import prisma from '../config/database';
import { cache } from '../lib/cache';

export class HealthController {
  async getHealth(req: Request, res: Response) {
    res.json({
      status:    'ok',
      service:   process.env.SERVICE_NAME || 'oracleiq-api',
      version:   process.env.npm_package_version || '1.0.0',
      timestamp: new Date().toISOString(),
      cache:     cache.isRedisAvailable() ? 'redis' : 'memory',
      uptime:    Math.floor(process.uptime()),
    });
  }

  async getStatus(req: Request, res: Response) {
    // Check if we have at least 500 markets synced
    const marketCount = await prisma.market.count();
    const isInitialized = marketCount > 500;

    res.json({
      status:    'ok',
      service:   process.env.SERVICE_NAME || 'oracleiq-api',
      version:   process.env.npm_package_version || '1.0.0',
      timestamp: new Date().toISOString(),
      cache:     cache.isRedisAvailable() ? 'redis' : 'memory',
      uptime:    Math.floor(process.uptime()),
      data: {
        status: isInitialized ? 'ready' : 'initializing',
        market_count: marketCount,
        required_markets: 500,
      }
    });
  }
}

export default new HealthController();