import { Request, Response } from 'express';
import { buildCodeExamples } from '../utils/codeExamples';
import { createApiError } from '../errors/errorCatalogue';

export class AlertsController {
  async registerAlert(req: Request, res: Response) {
    try {
      const { market_ids, category, trigger, webhook_url } = req.body;

      // Validation
      if (!webhook_url) {
        throw createApiError('MISSING_REQUIRED_FIELD', req, { field: 'webhook_url', location: 'body' });
      }

      // For this implementation, we'll just return success
      // In production, this would create an alert in the database
      
      res.json({
        success: true,
        data: {
          alert_id: 'alert_' + Date.now(),
          market_ids,
          category,
          trigger,
          webhook_url,
          status: 'active',
          created_at: new Date().toISOString()
        },
        meta: {
          code_examples: buildCodeExamples({
            method: 'POST',
            path: '/v1/alerts/register',
            sampleBody: {
              "market_id": "market_demo_2026_election",
              "threshold": 0.70,
              "direction": "above",
              "webhook_url": "https://your-app.com/webhooks/oracleiq"
            }
          })
        }
      });
    } catch (error) {
      throw error;
    }
  }

  async getAlerts(req: Request, res: Response) {
    try {
      res.json({
        success: true,
        data: {
          alerts: []
        }
      });
    } catch (error) {
      throw createApiError('INTERNAL_ERROR', req);
    }
  }

  async updateAlert(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      res.json({
        success: true,
        data: {
          alert_id: id,
          message: 'Alert updated successfully'
        }
      });
    } catch (error) {
      throw createApiError('INTERNAL_ERROR', req);
    }
  }

  async deleteAlert(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      res.json({
        success: true,
        data: {
          alert_id: id,
          message: 'Alert deleted successfully'
        }
      });
    } catch (error) {
      throw createApiError('INTERNAL_ERROR', req);
    }
  }
}

export default new AlertsController();