import axios from 'axios';
import { normalizePolymarketMarket } from '../normalisation/polymarket.normaliser';
import marketsService from '../services/markets.service';
import db from '../config/database';

const POLYMARKET_GAMMA_API = process.env.POLYMARKET_GAMMA_API || 'https://gamma-api.polymarket.com';

export class PolymarketSync {
  async syncMarkets(): Promise<any> {
    const startTime = Date.now();
    let marketsSynced = 0, marketsUpdated = 0, errors = 0;
    try {
      const response = await axios.get(`${POLYMARKET_GAMMA_API}/markets`, { params: { active: true, limit: 100, offset: 0 } });
      for (const raw of (response.data || [])) {
        try {
          const normalized = normalizePolymarketMarket(raw);
          const existingDoc = await db.collection('markets').doc(`polymarket_${normalized.source_id}`).get();
          const existing = existingDoc.exists ? existingDoc.data() : null;
          const upserted = await marketsService.upsertMarket(normalized);
          marketsSynced++;
          if (existing) { marketsUpdated++; if (Math.abs((existing.probability_yes || 0) - upserted.probability_yes) > 0.001) await marketsService.createSnapshot(upserted.id, upserted.probability_yes); }
          else { await marketsService.createSnapshot(upserted.id, upserted.probability_yes); }
        } catch (e) { console.error('Error normalizing Polymarket market:', e); errors++; }
      }
    } catch (e) { console.error('Error fetching Polymarket markets:', e); errors++; }
    const duration = Date.now() - startTime;
    await db.collection('syncLogs').add({ source: 'polymarket', sync_type: 'incremental', markets_synced: marketsSynced, markets_updated: marketsUpdated, errors, duration_ms: duration, status: errors > 0 ? 'partial' : 'success', createdAt: new Date() });
    return { source: 'polymarket', marketsSynced, marketsUpdated, errors, duration };
  }
}
export default new PolymarketSync();
