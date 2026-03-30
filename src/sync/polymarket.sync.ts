import axios from 'axios';
import { normalizePolymarketMarket } from '../normalisation/polymarket.normaliser';
import marketsService from '../services/markets.service';
import prisma from '../config/database';

const POLYMARKET_GAMMA_API = process.env.POLYMARKET_GAMMA_API || 'https://gamma-api.polymarket.com';

export class PolymarketSync {
  async syncMarkets(): Promise<any> {
    const startTime = Date.now();
    let marketsSynced = 0;
    let marketsUpdated = 0;
    let errors = 0;

    try {
      console.log('Starting Polymarket sync');

      const response = await axios.get(`${POLYMARKET_GAMMA_API}/markets`, {
        params: {
          active: true,
          limit: 100,
          offset: 0
        }
      });

      const polymarketMarkets = response.data || [];

      for (const polymarketMarket of polymarketMarkets) {
        try {
          const normalizedMarket = normalizePolymarketMarket(polymarketMarket);
          const existingMarket = await prisma.market.findFirst({
            where: {
              source_platform: 'polymarket',
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
          console.error('Error normalizing Polymarket market:', error);
          errors++;
        }
      }

      console.log(`Polymarket sync completed: ${polymarketMarkets.length} markets processed`);
    } catch (error) {
      console.error('Error fetching Polymarket markets:', error);
      errors++;
    }

    const duration = Date.now() - startTime;

    await prisma.syncLog.create({
      data: {
        source: 'polymarket',
        sync_type: 'incremental',
        markets_synced: marketsSynced,
        markets_updated: marketsUpdated,
        errors: errors,
        duration_ms: duration,
        status: errors > 0 ? 'partial' : 'success'
      }
    });

    return {
      source: 'polymarket',
      marketsSynced,
      marketsUpdated,
      errors,
      duration
    };
  }
}

export default new PolymarketSync();