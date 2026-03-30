import axios from 'axios';
import { normalizeMetaculusMarket } from '../normalisation/metaculus.normaliser';
import marketsService from '../services/markets.service';
import prisma from '../config/database';

const METACULUS_API_BASE = process.env.METACULUS_API_BASE || 'https://www.metaculus.com/api2';

export class MetaculusSync {
  async syncMarkets(): Promise<any> {
    const startTime = Date.now();
    let marketsSynced = 0;
    let marketsUpdated = 0;
    let errors = 0;

    try {
      console.log('Starting Metaculus sync');

      const response = await axios.get(`${METACULUS_API_BASE}/questions/`, {
        params: {
          status: 'open',
          has_community_prediction: true
        }
      });

      const metaculusMarkets = response.data?.results || [];

      for (const metaculusMarket of metaculusMarkets) {
        try {
          const normalizedMarket = normalizeMetaculusMarket(metaculusMarket);
          const existingMarket = await prisma.market.findFirst({
            where: {
              source_platform: 'metaculus',
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
          console.error('Error normalizing Metaculus market:', error);
          errors++;
        }
      }

      console.log(`Metaculus sync completed: ${metaculusMarkets.length} markets processed`);
    } catch (error) {
      console.error('Error fetching Metaculus markets:', error);
      errors++;
    }

    const duration = Date.now() - startTime;

    await prisma.syncLog.create({
      data: {
        source: 'metaculus',
        sync_type: 'incremental',
        markets_synced: marketsSynced,
        markets_updated: marketsUpdated,
        errors: errors,
        duration_ms: duration,
        status: errors > 0 ? 'partial' : 'success'
      }
    });

    return {
      source: 'metaculus',
      marketsSynced,
      marketsUpdated,
      errors,
      duration
    };
  }
}

export default new MetaculusSync();