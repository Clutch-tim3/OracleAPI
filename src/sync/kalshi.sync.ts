import axios from 'axios';
import { normalizeKalshiMarket } from '../normalisation/kalshi.normaliser';
import marketsService from '../services/markets.service';
import prisma from '../config/database';

const KALSHI_API_BASE = process.env.KALSHI_API_BASE || 'https://api.elections.kalshi.com/trade-api/v2';

export class KalshiSync {
  async syncMarkets(): Promise<any> {
    const startTime = Date.now();
    let marketsSynced = 0;
    let marketsUpdated = 0;
    let errors = 0;

    try {
      console.log('Starting Kalshi sync');

      const response = await axios.get(`${KALSHI_API_BASE}/markets`, {
        params: {
          status: 'open',
          limit: 100
        }
      });

      const kalshiMarkets = response.data.markets || [];

      for (const kalshiMarket of kalshiMarkets) {
        try {
          const normalizedMarket = normalizeKalshiMarket(kalshiMarket);
          const existingMarket = await prisma.market.findFirst({
            where: {
              source_platform: 'kalshi',
              source_id: normalizedMarket.source_id
            }
          });

          const upsertedMarket = await marketsService.upsertMarket(normalizedMarket);
          marketsSynced++;

          if (existingMarket) {
            marketsUpdated++;
            // Create snapshot if probability changed by more than 0.1%
            if (Math.abs(existingMarket.probability_yes - upsertedMarket.probability_yes) > 0.001) {
              await marketsService.createSnapshot(upsertedMarket.id, upsertedMarket.probability_yes);
            }
          } else {
            await marketsService.createSnapshot(upsertedMarket.id, upsertedMarket.probability_yes);
          }
        } catch (error) {
          console.error('Error normalizing Kalshi market:', error);
          errors++;
        }
      }

      console.log(`Kalshi sync completed: ${kalshiMarkets.length} markets processed`);
    } catch (error) {
      console.error('Error fetching Kalshi markets:', error);
      errors++;
    }

    const duration = Date.now() - startTime;

    await prisma.syncLog.create({
      data: {
        source: 'kalshi',
        sync_type: 'incremental',
        markets_synced: marketsSynced,
        markets_updated: marketsUpdated,
        errors: errors,
        duration_ms: duration,
        status: errors > 0 ? 'partial' : 'success'
      }
    });

    return {
      source: 'kalshi',
      marketsSynced,
      marketsUpdated,
      errors,
      duration
    };
  }
}

export default new KalshiSync();