import db from '../config/database';
import { formatProbabilityChange, formatCurrency } from '../utils/formatting';

const marketsRef  = db.collection('markets');
const trendingRef = db.collection('trendingMarkets');

export class TrendingService {
  async getTrendingMarkets(params: any): Promise<any> {
    const { category, platform, timeframe = '24h', limit = 20 } = params;

    let query: any = trendingRef.orderBy('trending_score', 'desc').limit(limit * 3);
    const snap = await query.get();

    // Fetch corresponding markets
    const trendingDocs = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    const marketIds = trendingDocs.map((t: any) => t.market_id);
    const marketDocs = await Promise.all(marketIds.map((id: string) => marketsRef.doc(id).get()));
    const marketMap = new Map<string, any>();
    marketDocs.forEach((d: any) => { if (d.exists) marketMap.set(d.id, { id: d.id, ...d.data() }); });

    let results = trendingDocs
      .map((tm: any) => ({ tm, market: marketMap.get(tm.market_id) }))
      .filter(({ market }: any) => {
        if (!market) return false;
        if (category && market.category !== category) return false;
        if (platform && platform !== 'all' && market.source_platform !== platform) return false;
        return true;
      })
      .slice(0, limit);

    return {
      as_of: new Date().toISOString(),
      timeframe,
      markets: results.map(({ tm, market }: any, index: number) => ({
        trending_rank: index + 1,
        id: market.id,
        title: market.title,
        category: market.category,
        platform: market.source_platform,
        probability_yes: market.probability_yes,
        probability_change_24h: tm.prob_change_24h,
        change_formatted: formatProbabilityChange(tm.prob_change_24h || 0),
        volume_24h: market.volume_24h,
        volume_24h_formatted: formatCurrency(market.volume_24h || 0),
        trending_reasons: tm.reason,
        significance_score: market.significance_score
      }))
    };
  }

  async updateTrendingMarkets(): Promise<void> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const snap = await marketsRef.where('status', '==', 'open').get();
    const batch = db.batch();
    const updates: any[] = [];

    for (const doc of snap.docs) {
      const market: any = { id: doc.id, ...doc.data() };
      const snapsSnap = await doc.ref.collection('snapshots')
        .where('snapshot_at', '>=', oneDayAgo)
        .orderBy('snapshot_at', 'asc').get();

      const snaps = snapsSnap.docs.map((s: any) => s.data());
      if (snaps.length < 2) continue;

      const probChange24h = snaps[snaps.length - 1].probability_yes - snaps[0].probability_yes;
      const hourSnaps = snaps.filter((s: any) => {
        const t = s.snapshot_at?.toDate?.() ?? new Date(s.snapshot_at);
        return t >= oneHourAgo;
      });
      const probChange1h = hourSnaps.length > 1
        ? hourSnaps[hourSnaps.length - 1].probability_yes - hourSnaps[0].probability_yes
        : 0;

      const trendingScore =
        Math.abs(probChange1h) * 40 +
        Math.min((market.volume_24h || 0) / 10000, 1) * 30 +
        10;

      updates.push({
        market_id: market.id,
        trending_score: trendingScore,
        reason: this.determineTrendingReasons(probChange1h, probChange24h, market.volume_24h || 0),
        prob_change_1h: probChange1h,
        prob_change_24h: probChange24h,
        volume_change_24h: market.volume_24h || 0,
        last_updated: new Date()
      });
    }

    updates.sort((a, b) => b.trending_score - a.trending_score);
    const top100 = updates.slice(0, 100);
    for (const u of top100) {
      batch.set(trendingRef.doc(u.market_id), u, { merge: true });
    }
    await batch.commit();
  }

  private determineTrendingReasons(p1h: number, p24h: number, vol: number): string[] {
    const r: string[] = [];
    if (Math.abs(p1h) > 0.05)  r.push('Largest 1-hour move');
    if (Math.abs(p24h) > 0.10) r.push('Significant 24-hour move');
    if (vol > 500000)           r.push('High trading volume');
    if (!r.length)              r.push('Recent market activity');
    return r;
  }
}

export default new TrendingService();
