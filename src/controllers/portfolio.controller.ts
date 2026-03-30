import { Request, Response } from 'express';
import portfolioService from '../services/portfolio.service';
import { PortfolioSimulationRequest } from '../types/api.types';
import { buildCodeExamples } from '../utils/codeExamples';
import { createApiError } from '../errors/errorCatalogue';

export class PortfolioController {
  async simulatePortfolio(req: Request, res: Response) {
    try {
      const request: PortfolioSimulationRequest = req.body;
      const result = await portfolioService.simulatePortfolio(request);
      
      res.json({
        success: true,
        data: result,
        meta: {
          code_examples: buildCodeExamples({
            method: 'POST',
            path: '/v1/portfolio/simulate',
            sampleBody: {
              "positions": [
                { "market_id": "market_demo_2026_election", "probability": 0.65, "stake": 100 }
              ],
              "scenarios": ["bull", "bear"]
            }
          })
        }
      });
    } catch (error) {
      throw error;
    }
  }
}

export default new PortfolioController();