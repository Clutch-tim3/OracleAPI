import axios from 'axios';
import { normalizeManifoldMarket } from '../normalisation/manifold.normaliser';
import marketsService from '../services/markets.service';
import db from '../config/database';

const MANIFOLD_API_BASE = process.env.MANIFOLD_API_BASE || 'https://api.manifold.markets/v0';

export class ManifoldSync {
  async syncMarkets(): Promise<any> {
    const startTime = Date.now();
    let marketsSynced = 0, marketsUpdated = 0, errors = 0;
    try {
      const response = await axios.get(`${MANIFOLD_API_BASE}/markets`, { params: { limit: 100 } });
      for (const raw of (response.data || [])) {
        try {
          const normalized = normalizeManifoldMarket(raw);
          const existingDoc = await db.collection('markets').doc(`manifold_${normalized.source_id}`).get();
          const existing = existingDoc.exists ? existingDoc.data() : null;
          const upserted = await marketsService.upsertMarket(normalized);
          marketsSynced++;
          if (existing) { marketsUpdated++; if (Math.abs((existing.probability_yes || 0) - upserted.probability_yes) > 0.001) await marketsService.createSnapshot(upserted.id, upserted.probability_yes); }
          else { await marketsService.createSnapshot(upserted.id, upserted.probability_yes); }
        } catch (e) { console.error('Error normalizing Manifold market:', e); errors++; }
      }
    } catch (e) { console.error('Error fetching Manifold markets:', e); errors++; }
    const duration = Date.now() - startTime;
    await db.collection('syncLogs').add({ source: 'manifold', sync_type: 'incremental', markets_synced: marketsSynced, markets_updated: marketsUpdated, errors, duration_ms: duration, status: errors > 0 ? 'partial' : 'success', createdAt: new Date() });
    return { source: 'manifold', marketsSynced, marketsUpdated, errors, duration };
  }
}
export default new ManifoldSync();
