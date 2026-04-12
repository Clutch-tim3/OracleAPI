import axios from 'axios';
import { normalizeMetaculusMarket } from '../normalisation/metaculus.normaliser';
import marketsService from '../services/markets.service';
import db from '../config/database';

const METACULUS_API_BASE = process.env.METACULUS_API_BASE || 'https://www.metaculus.com/api2';

export class MetaculusSync {
  async syncMarkets(): Promise<any> {
    const startTime = Date.now();
    let marketsSynced = 0, marketsUpdated = 0, errors = 0;
    try {
      const response = await axios.get(`${METACULUS_API_BASE}/questions/`, { params: { status: 'open', has_community_prediction: true } });
      for (const raw of (response.data?.results || [])) {
        try {
          const normalized = normalizeMetaculusMarket(raw);
          const existingDoc = await db.collection('markets').doc(`metaculus_${normalized.source_id}`).get();
          const existing = existingDoc.exists ? existingDoc.data() : null;
          const upserted = await marketsService.upsertMarket(normalized);
          marketsSynced++;
          if (existing) { marketsUpdated++; if (Math.abs((existing.probability_yes || 0) - upserted.probability_yes) > 0.001) await marketsService.createSnapshot(upserted.id, upserted.probability_yes); }
          else { await marketsService.createSnapshot(upserted.id, upserted.probability_yes); }
        } catch (e) { console.error('Error normalizing Metaculus market:', e); errors++; }
      }
    } catch (e) { console.error('Error fetching Metaculus markets:', e); errors++; }
    const duration = Date.now() - startTime;
    await db.collection('syncLogs').add({ source: 'metaculus', sync_type: 'incremental', markets_synced: marketsSynced, markets_updated: marketsUpdated, errors, duration_ms: duration, status: errors > 0 ? 'partial' : 'success', createdAt: new Date() });
    return { source: 'metaculus', marketsSynced, marketsUpdated, errors, duration };
  }
}
export default new MetaculusSync();
