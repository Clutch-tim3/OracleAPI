import { SemanticSearchResponse } from '../types/api.types';
import db from '../config/database';

const marketsRef = db.collection('markets');

export class SemanticSearchService {
  async searchMarkets(query: string, limit: number = 10): Promise<SemanticSearchResponse> {
    const interpretation = this.interpretQuery(query);
    const searchTerms = this.extractSearchTerms(query);

    // Fetch open markets and filter in-memory
    const snapshot = await marketsRef.where('status', '==', 'open').limit(300).get();
    const markets = snapshot.docs
      .map((d: any) => ({ id: d.id, ...d.data() }))
      .filter((m: any) =>
        searchTerms.some((term: string) =>
          m.title?.toLowerCase().includes(term) ||
          m.description?.toLowerCase().includes(term)
        )
      )
      .slice(0, limit);

    return {
      query,
      interpretation,
      markets: markets.map((market: any, index: number) => ({
        relevance_score: 0.9 - (index * 0.05),
        relevance_explanation: this.getRelevanceExplanation(market, query),
        title: market.title,
        probability_yes: market.probability_yes,
        volume: `$${market.total_volume?.toLocaleString() || '0'}`,
        platform: market.source_platform
      }))
    };
  }

  private interpretQuery(query: string): string {
    const q = query.toLowerCase();
    if (q.includes('recession'))   return 'User is asking about US economic recession probability';
    if (q.includes('fed') || q.includes('interest rate')) return 'User is asking about Federal Reserve monetary policy';
    if (q.includes('election'))    return 'User is asking about election outcomes';
    if (q.includes('bitcoin') || q.includes('crypto')) return 'User is asking about cryptocurrency price movements';
    if (q.includes('ai') || q.includes('artificial intelligence')) return 'User is asking about artificial intelligence developments';
    return `User is asking about "${query}"`;
  }

  private extractSearchTerms(query: string): string[] {
    const stop = new Set(['how','what','when','where','why','will','the','a','an']);
    return query.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(t => t.length > 2 && !stop.has(t))
      .slice(0, 5);
  }

  private getRelevanceExplanation(market: any, query: string): string {
    if (market.title?.toLowerCase().includes(query.toLowerCase())) {
      return 'Direct match - this market directly addresses the query';
    }
    const matching = this.extractSearchTerms(query).filter(term =>
      market.title?.toLowerCase().split(/\s+/).some((t: string) => t.includes(term))
    );
    if (matching.length > 0) return `Relevant keywords match: ${matching.join(', ')}`;
    return 'Market is potentially related to the query topic';
  }
}

export default new SemanticSearchService();
