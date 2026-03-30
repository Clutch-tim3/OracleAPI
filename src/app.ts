import express from 'express';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import hpp from 'hpp';
import xss from 'xss-clean';
import morgan from 'morgan';
import 'express-async-errors';

import marketsRoutes from './routes/markets.routes';
import portfolioRoutes from './routes/portfolio.routes';
import alertsRoutes from './routes/alerts.routes';
import embedRoutes from './routes/embed.routes';
import healthRoutes from './routes/health.routes';

import { scheduleSyncJobs, runInitialSync } from './jobs/sync.jobs';
import { seedDemoMarkets } from './seeders/demo.seeder';
import { requestIdMiddleware } from './middleware/requestId.middleware';
import { errorHandlerMiddleware } from './middleware/errorHandler.middleware';
import { cache } from './lib/cache';

// Validate required environment variables at startup
const REQUIRED_ENV = (() => {
  // List the env vars your API actually NEEDS to function
  // (not Redis — that's optional now)
  const required: string[] = [];

  // Uncomment the ones that apply to THIS specific API:
  // if (!process.env.ANTHROPIC_API_KEY) required.push('ANTHROPIC_API_KEY');
  // if (!process.env.SHODAN_API_KEY)    required.push('SHODAN_API_KEY');
  // if (!process.env.NVD_API_KEY)       required.push('NVD_API_KEY');
  // etc.

  return required;
})();

const missing = REQUIRED_ENV.filter(v => !process.env[v]);
if (missing.length > 0) {
  console.error(`[startup] Missing required environment variables: ${missing.join(', ')}`);
  // Don't crash — log it and continue so health check still responds
}

// Log Redis status on startup without crashing
setTimeout(async () => {
  const r = cache.isRedisAvailable();
  console.log(`[startup] Cache: ${r ? 'Redis' : 'in-memory fallback'}`);
}, 2000);

const app = express();

// Request ID middleware - must come first
app.use(requestIdMiddleware);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"]
    }
  }
}));
app.use(hpp());
app.use(xss());

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://rapidapi.com', 'https://oracleiq.dev']
    : true
}));

// Compression and parsing
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Seed demo markets on startup
seedDemoMarkets();

// Routes
app.use('/v1/markets', marketsRoutes);
app.use('/v1/portfolio', portfolioRoutes);
app.use('/v1/alerts', alertsRoutes);
app.use('/embed', embedRoutes);
app.use('/v1/health', healthRoutes);

// Health check endpoint (public)
  app.get('/health', async (req, res) => {
    res.json({
      status:    'ok',
      service:   process.env.SERVICE_NAME || 'oracleiq-api',
      version:   process.env.npm_package_version || '1.0.0',
      timestamp: new Date().toISOString(),
      cache:     cache.isRedisAvailable() ? 'redis' : 'memory',
      uptime:    Math.floor(process.uptime()),
    });
  });

// Error handling
app.use(errorHandlerMiddleware);

// 404 handler
app.use('*', (req: express.Request, res: express.Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
      detail: 'The requested endpoint does not exist. Please check the API documentation.',
      docs_url: 'https://oracleiq.dev/docs/errors#NOT_FOUND',
      request_id: res.locals.requestId,
      timestamp: new Date().toISOString(),
      available_endpoints: [
        '/v1/markets',
        '/v1/markets/:id',
        '/v1/markets/trending',
        '/v1/markets/consensus',
        '/v1/markets/search/semantic',
        '/v1/portfolio/simulate',
        '/v1/alerts/register',
        '/embed/:marketId',
        '/v1/health'
      ]
    }
  });
});

export { app, scheduleSyncJobs, runInitialSync };