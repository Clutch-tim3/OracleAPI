import axios from 'axios';
import { normalizeManifoldMarket } from '../normalisation/manifold.normaliser';
import marketsService from '../services/markets.service';
import prisma from '../config/database';

const MANIFOLD_API_BASE = process.env.MANIFOLD_API_BASE || 'https://api.manifold.markets/v0';

export class ManifoldSync {
  async syncMarkets(): Promise<any> {
    const startTime = Date.now();
    let marketsSynced = 0;
    let marketsUpdated = 0;
    let errors = 0;

    try {
      console.log('Starting Manifold sync');

      const response = await axios.get(`${MANIFOLD_API_BASE}/markets`, {
        params: {
          limit: 100
        }
      });

      const manifoldMarkets = response.data || [];

      for (const manifoldMarket of manifoldMarkets) {
        try {
          const normalizedMarket = normalizeManifoldMarket(manifoldMarket);
          const existingMarket = await prisma.market.findFirst({
            where: {
              source_platform: 'manifold',
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
          console.error('Error normalizing Manifold market:', error);
          errors++;
        }
      }

      console.log(`Manifold sync completed: ${manifoldMarkets.length} markets processed`);
    } catch (error) {
      console.error('Error fetching Manifold markets:', error);
      errors++;
    }

    const duration = Date.now() - startTime;

    await prisma.syncLog.create({
      data: {
        source: 'manifold',
        sync_type: 'incremental',
        markets_synced: marketsSynced,
        markets_updated: marketsUpdated,
        errors: errors,
        duration_ms: duration,
        status: errors > 0 ? 'partial' : 'success'
      }
    });

    return {
      source: 'manifold',
      marketsSynced,
      marketsUpdated,
      errors,
      duration
    };
  }
}

export default new ManifoldSync();