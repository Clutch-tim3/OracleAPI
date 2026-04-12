import db from '../config/database';
import { MarketData } from '../types/market.types';
import { formatTimeRemaining, formatCurrency, formatProbabilityChange } from '../utils/formatting';
import { getChangeVelocity, getChangeDirection } from '../utils/probabilityUtils';

const marketsRef = db.collection('markets');

export class MarketsService {
  async findAll(params: any): Promise<any> {
    const {
      q,
      category,
      platform,
      status = 'open',
      closes_within,
      min_volume,
      probability_min,
      probability_max,
      moving,
      sort = 'trending',
      limit = 20,
      offset = 0
    } = params;

    let query: any = marketsRef;

    // Equality filters (Firestore-safe, no index required)
    if (status && status !== 'all') query = query.where('status', '==', status);
    if (category)                   query = query.where('category', '==', category);
    if (platform && platform !== 'all') query = query.where('source_platform', '==', platform);

    // Ordering — must match any inequality filter field when combined
    switch (sort) {
      case 'volume':          query = query.orderBy('total_volume', 'desc'); break;
      case 'closing_soon':    query = query.orderBy('closes_at', 'asc'); break;
      case 'recently_updated': query = query.orderBy('last_synced', 'desc'); break;
      case 'significance':    query = query.orderBy('significance_score', 'desc'); break;
      case 'probability_asc': query = query.orderBy('probability_yes', 'asc'); break;
      case 'probability_desc': query = query.orderBy('probability_yes', 'desc'); break;
      case 'trending':
      default:                query = query.orderBy('probability_change_24h', 'desc'); break;
    }

    // Over-fetch so we have room for in-memory filtering
    const snapshot = await query.limit(Math.min((offset + limit) * 4, 500)).get();
    let docs = snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() })) as any[];

    // In-memory filters (text search, ranges, flags)
    if (q) {
      const lq = q.toLowerCase();
      docs = docs.filter(m =>
        m.title?.toLowerCase().includes(lq) ||
        m.description?.toLowerCase().includes(lq)
      );
    }
    if (min_volume !== undefined) {
      docs = docs.filter(m => (m.total_volume || 0) >= min_volume);
    }
    if (probability_min !== undefined) {
      docs = docs.filter(m => (m.probability_yes || 0) >= probability_min / 100);
    }
    if (probability_max !== undefined) {
      docs = docs.filter(m => (m.probability_yes || 0) <= probability_max / 100);
    }
    if (moving) {
      docs = docs.filter(m => Math.abs(m.probability_change_24h || 0) >= 0.03);
    }
    if (closes_within) {
      const futureDate = new Date();
      switch (closes_within) {
        case '24h': futureDate.setHours(futureDate.getHours() + 24); break;
        case '7d':  futureDate.setDate(futureDate.getDate() + 7); break;
        case '30d': futureDate.setDate(futureDate.getDate() + 30); break;
        case '90d': futureDate.setDate(futureDate.getDate() + 90); break;
      }
      docs = docs.filter(m => {
        const closesAt = m.closes_at?.toDate?.() ?? (m.closes_at ? new Date(m.closes_at) : null);
        return closesAt && closesAt <= futureDate;
      });
    }

    const total = docs.length;
    const paginated = docs.slice(offset, offset + limit);
    return {
      total,
      returned: paginated.length,
      offset,
      markets: paginated.map((m, i) => this.formatMarketListItem(m, offset + i + 1))
    };
  }

  async findById(id: string): Promise<any> {
    // Try direct doc lookup first
    const doc = await marketsRef.doc(id).get();
    let marketDoc: any;
    let marketRef: any;

    if (doc.exists) {
      marketDoc = doc;
      marketRef = doc.ref;
    } else {
      // Fall back to querying by stored id field
      const snap = await marketsRef.where('id', '==', id).limit(1).get();
      if (snap.empty) return null;
      marketDoc = snap.docs[0];
      marketRef = snap.docs[0].ref;
    }

    const snapshotsSnap = await marketRef.collection('snapshots')
      .orderBy('snapshot_at', 'asc').limit(30).get();

    const market: any = {
      id: marketDoc.id,
      ...marketDoc.data(),
      snapshots: snapshotsSnap.docs.map((s: any) => s.data()),
    };
    return this.formatMarketDetail(market);
  }

  async upsertMarket(data: MarketData): Promise<any> {
    const docId = `${data.source_platform}_${data.source_id}`;
    const docRef = marketsRef.doc(docId);
    await docRef.set({ ...data, last_synced: new Date() }, { merge: true });
    const updated = await docRef.get();
    return { id: docRef.id, ...updated.data() };
  }

  async createSnapshot(marketId: string, probabilityYes: number): Promise<void> {
    await marketsRef.doc(marketId).collection('snapshots').add({
      market_id: marketId,
      probability_yes: probabilityYes,
      snapshot_at: new Date(),
    });
  }

  private formatMarketListItem(market: any, rank: number) {
    const closesAt = market.closes_at?.toDate?.() ?? (market.closes_at ? new Date(market.closes_at) : null);
    const closesIn = closesAt ? formatTimeRemaining(closesAt) : 'No date';

    return {
      id: market.id,
      source_platform: market.source_platform,
      source_id: market.source_id,
      source_url: market.source_url,
      title: market.title,
      category: market.category,
      sub_category: market.sub_category,
      tags: market.tags,
      market_type: market.market_type,
      status: market.status,
      closes_at: closesAt?.toISOString(),
      closes_in: closesIn,
      probability: {
        yes: market.probability_yes,
        no: 1 - (market.probability_yes || 0),
        yes_pct: Math.round((market.probability_yes || 0) * 100),
        no_pct: Math.round((1 - (market.probability_yes || 0)) * 100),
        formatted: `${Math.round((market.probability_yes || 0) * 100)}% chance YES`
      },
      movement: {
        change_24h: market.probability_change_24h,
        change_24h_formatted: formatProbabilityChange(market.probability_change_24h || 0),
        change_7d: market.probability_change_7d,
        direction: getChangeDirection(market.probability_change_24h || 0),
        velocity: getChangeVelocity(market.probability_change_24h || 0)
      },
      volume: {
        total: market.total_volume,
        formatted: formatCurrency(market.total_volume || 0),
        last_24h: market.volume_24h,
        last_24h_formatted: `${formatCurrency(market.volume_24h || 0)} (24h)`
      },
      significance_score: market.significance_score,
      trending_rank: rank,
      platform_logo_url: `https://oracleiq.dev/logos/${market.source_platform}.png`
    };
  }

  private formatMarketDetail(market: any) {
    const base = this.formatMarketListItem(market, 0);
    return {
      ...base,
      outcomes: market.outcomes,
      probability_history: (market.snapshots || []).map((s: any) => {
        const snapshotAt = s.snapshot_at?.toDate?.() ?? (s.snapshot_at ? new Date(s.snapshot_at) : null);
        return { timestamp: snapshotAt?.toISOString(), probability: s.probability_yes };
      }),
      related_markets: this.getRelatedMarkets(market),
      cross_platform: this.getCrossPlatformMarkets(market),
      embed: this.getEmbedCode(market.id)
    };
  }

  private getRelatedMarkets(_market: any) {
    return [
      { id: 'clx9k3...', title: 'Will the Fed cut rates in 2026?', platform: 'polymarket', probability_yes: 0.71, relationship: 'parent_event' },
      { id: 'clx9k4...', title: 'Fed Funds Rate above 4.5% at end of 2026?', platform: 'kalshi', probability_yes: 0.28, relationship: 'related_topic' }
    ];
  }

  private getCrossPlatformMarkets(market: any) {
    if (market.source_platform === 'kalshi') {
      return {
        same_question_other_platforms: [{
          platform: 'polymarket',
          title: 'Fed cuts in March 2026?',
          probability_yes: 0.31,
          price_difference: -0.03,
          note: '3pp lower on Polymarket — potential arbitrage signal'
        }]
      };
    }
    return { same_question_other_platforms: [] };
  }

  private getEmbedCode(marketId: string) {
    const widgetUrl = `https://oracleiq.dev/embed/${marketId}`;
    return {
      widget_url: widgetUrl,
      iframe_code: `<iframe src='${widgetUrl}' width='360' height='200' frameborder='0'></iframe>`,
      script_tag: `<div id='oracleiq-${marketId}'></div>\n<script src='https://oracleiq.dev/widget.js' data-market='${marketId}'></script>`
    };
  }
}

export default new MarketsService();
