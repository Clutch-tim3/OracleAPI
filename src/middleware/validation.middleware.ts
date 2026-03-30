import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

const marketQuerySchema = z.object({
  q: z.string().optional(),
  category: z.enum([
    'politics', 'economics', 'finance', 'sports', 'technology',
    'climate', 'culture', 'crypto', 'science', 'geopolitics', 'entertainment'
  ]).optional(),
  platform: z.enum(['kalshi', 'polymarket', 'metaculus', 'manifold', 'all']).optional().default('all'),
  status: z.enum(['open', 'closed', 'resolved', 'all']).optional().default('open'),
  closes_within: z.enum(['24h', '7d', '30d', '90d']).optional(),
  min_volume: z.coerce.number().min(0).optional(),
  probability_min: z.coerce.number().min(0).max(100).optional(),
  probability_max: z.coerce.number().min(0).max(100).optional(),
  moving: z.coerce.boolean().optional(),
  sort: z.enum([
    'trending', 'volume', 'closing_soon', 'recently_updated',
    'significance', 'probability_asc', 'probability_desc'
  ]).optional().default('trending'),
  limit: z.coerce.number().min(1).max(50).optional().default(20),
  offset: z.coerce.number().min(0).optional().default(0)
});

const analysisRequestSchema = z.object({
  analysis_depth: z.enum(['quick', 'standard', 'deep']).default('standard'),
  perspective: z.enum(['neutral', 'bull', 'bear']).default('neutral'),
  audience: z.enum(['general', 'trader', 'journalist', 'researcher']).default('general'),
  include_historical_context: z.boolean().default(true),
  include_price_drivers: z.boolean().default(true),
  include_scenarios: z.boolean().default(true)
});

const portfolioSimulationSchema = z.object({
  positions: z.array(z.object({
    market_id: z.string(),
    side: z.enum(['yes', 'no']),
    entry_probability: z.number().min(0).max(1),
    stake: z.number().min(0),
    entry_date: z.string()
  })),
  cash_balance: z.number().min(0),
  include_pnl: z.boolean().optional().default(true),
  include_expected_value: z.boolean().optional().default(true)
});

export const validateMarketQuery = (req: Request, res: Response, next: NextFunction) => {
  try {
    marketQuerySchema.parse(req.query);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
          details: error.issues.map(issue => ({
            field: issue.path[0],
            message: issue.message
          }))
        }
      });
    }
    next(error);
  }
};

export const validateAnalysisRequest = (req: Request, res: Response, next: NextFunction) => {
  try {
    analysisRequestSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: error.issues.map(issue => ({
            field: issue.path[0],
            message: issue.message
          }))
        }
      });
    }
    next(error);
  }
};

export const validatePortfolioSimulation = (req: Request, res: Response, next: NextFunction) => {
  try {
    portfolioSimulationSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: error.issues.map(issue => ({
            field: issue.path[0],
            message: issue.message
          }))
        }
      });
    }
    next(error);
  }
};