import { Request, Response } from 'express';
import marketsService from '../services/markets.service';
import analysisService from '../services/analysis.service';
import trendingService from '../services/trending.service';
import consensusService from '../services/consensus.service';
import semanticSearchService from '../services/semanticSearch.service';
import { AnalysisRequest } from '../types/api.types';
import { buildCodeExamples } from '../utils/codeExamples';
import { createApiError } from '../errors/errorCatalogue';

export class MarketsController {
  async getAllMarkets(req: Request, res: Response) {
    try {
      const results = await marketsService.findAll(req.query);
      
      res.json({
        success: true,
        data: results,
        meta: {
          code_examples: buildCodeExamples({
            method: 'GET',
            path: '/v1/markets',
            sampleParams: '?category=us-elections&limit=10&sort=volume'
          }),
          demo_markets_available: true,
          demo_note: 'Try these demo market IDs to explore the API: market_demo_inflation_2026, market_demo_fed_rate_2026, market_demo_btc_100k — they always return rich data.'
        }
      });
    } catch (error) {
      throw createApiError('INTERNAL_ERROR', req);
    }
  }

  async getMarketById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const market = await marketsService.findById(id);

      if (!market) {
        throw createApiError('MARKET_NOT_FOUND', req, { marketId: id });
      }

      res.json({
        success: true,
        data: market,
        meta: {
          code_examples: buildCodeExamples({
            method: 'GET',
            path: '/v1/markets/market_demo_2026_election'
          })
        }
      });
    } catch (error) {
      throw error;
    }
  }

  async analyzeMarket(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const request: AnalysisRequest = req.body;
      
      const analysis = await analysisService.analyzeMarket(id, request);
      
      res.json({
        success: true,
        data: analysis,
        meta: {
          code_examples: buildCodeExamples({
            method: 'POST',
            path: '/v1/markets/market_demo_2026_election/analyse',
            sampleBody: {
              "market_id": "market_demo_2026_election",
              "analysis_depth": "standard"
            }
          })
        }
      });
    } catch (error) {
      throw error;
    }
  }

  async getTrendingMarkets(req: Request, res: Response) {
    try {
      const trending = await trendingService.getTrendingMarkets(req.query);
      
      res.json({
        success: true,
        data: trending,
        meta: {
          code_examples: buildCodeExamples({
            method: 'GET',
            path: '/v1/markets/trending',
            sampleParams: '?window=24h&limit=5'
          })
        }
      });
    } catch (error) {
      throw createApiError('INTERNAL_ERROR', req);
    }
  }

  async getConsensus(req: Request, res: Response) {
    try {
      const { topic } = req.query;
      
      if (!topic || typeof topic !== 'string') {
        throw createApiError('MISSING_REQUIRED_FIELD', req, { field: 'topic', location: 'query' });
      }

      const consensus = await consensusService.getConsensus(
        topic,
        parseInt(req.query.max_markets as string) || 10
      );
      
      res.json({
        success: true,
        data: consensus,
        meta: {
          code_examples: buildCodeExamples({
            method: 'GET',
            path: '/v1/markets/consensus',
            sampleParams: '?category=economics&min_markets=3'
          })
        }
      });
    } catch (error) {
      throw error;
    }
  }

  async searchMarkets(req: Request, res: Response) {
    try {
      const { q } = req.query;
      
      if (!q || typeof q !== 'string') {
        throw createApiError('MISSING_REQUIRED_FIELD', req, { field: 'q', location: 'query' });
      }

      const results = await semanticSearchService.searchMarkets(
        q,
        parseInt(req.query.limit as string) || 10
      );
      
      res.json({
        success: true,
        data: results,
        meta: {
          code_examples: buildCodeExamples({
            method: 'GET',
            path: '/v1/markets/search/semantic',
            sampleParams: '?q=will+inflation+decrease+this+year&limit=5'
          })
        }
      });
    } catch (error) {
      throw error;
    }
  }

  async getResolvedMarkets(req: Request, res: Response) {
    try {
      res.json({
        success: true,
        data: {
          markets: []
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to fetch resolved markets'
        }
      });
    }
  }

  async getMarketComparison(req: Request, res: Response) {
    try {
      const { market_id_1, market_id_2 } = req.query;
      
      if (!market_id_1 || !market_id_2) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Both market_id_1 and market_id_2 are required'
          }
        });
      }

      res.json({
        success: true,
        data: {
          comparison: []
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'COMPARISON_ERROR',
          message: 'Failed to compare markets'
        }
      });
    }
  }
}

export default new MarketsController();