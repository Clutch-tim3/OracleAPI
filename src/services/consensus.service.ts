import prisma from '../config/database';
import { ConsensusResponse } from '../types/api.types';
import { formatTimeRemaining, formatCurrency } from '../utils/formatting';

export class ConsensusService {
  async getConsensus(topic: string, maxMarkets: number = 10): Promise<ConsensusResponse> {
    // Search for markets related to the topic
    const relatedMarkets = await prisma.market.findMany({
      where: {
        status: 'open',
        OR: [
          { title: { contains: topic, mode: 'insensitive' } },
          { description: { contains: topic, mode: 'insensitive' } },
          { tags: { hasSome: topic.toLowerCase().split(' ') } }
        ]
      },
      take: maxMarkets
    });

    if (relatedMarkets.length === 0) {
      return this.createNoMarketsFoundResponse(topic);
    }

    const consensus = this.analyzeConsensus(relatedMarkets);
    
    return {
      topic: topic,
      markets_found: relatedMarkets.length,
      as_of: new Date().toISOString(),
      consensus_view: consensus,
      market_breakdown: relatedMarkets.slice(0, 5).map(market => ({
        title: market.title,
        probability_yes: market.probability_yes,
        closes_in: formatTimeRemaining(market.closes_at!),
        volume: formatCurrency(market.total_volume || 0)
      })),
      probability_timeline: this.getTimelineData(relatedMarkets)
    };
  }

  private createNoMarketsFoundResponse(topic: string): ConsensusResponse {
    return {
      topic: topic,
      markets_found: 0,
      as_of: new Date().toISOString(),
      consensus_view: {
        one_liner: 'No active prediction markets found for this topic',
        confidence: 'low',
        confidence_basis: 'No active markets available',
        narrative: `There are currently no active prediction markets related to "${topic}". Markets may open as the topic gains more attention or relevant events approach.`
      },
      market_breakdown: [],
      probability_timeline: {}
    };
  }

  private analyzeConsensus(markets: any[]): any {
    // Sample analysis - in real implementation this would use AI
    const totalVolume = markets.reduce((sum, market) => sum + (market.total_volume || 0), 0);
    const avgProbability = markets.reduce((sum, market) => sum + (market.probability_yes || 0), 0) / markets.length;

    return {
      one_liner: 'Market consensus is forming with moderate confidence',
      confidence: 'moderate',
      confidence_basis: `${markets.length} related markets with $${totalVolume.toLocaleString()} combined volume`,
      narrative: `Prediction markets paint a picture of ${(avgProbability * 100).toFixed(0)}% probability for YES outcomes related to "${markets[0].title.split(' ').slice(0, 3).join(' ')}...". The market-implied view is based on ${markets.length} related markets across platforms with $${totalVolume.toLocaleString()} in trading volume. Any significant news or data release related to this topic would substantially reprice this consensus.`
    };
  }

  private getTimelineData(markets: any[]): any {
    const timeline: any = {};
    
    // For demo purposes, create a sample timeline
    const now = new Date();
    const futureDates = [
      { key: 'next_cut_by_march', days: 13 },
      { key: 'next_cut_by_may', days: 74 },
      { key: 'next_cut_by_june', days: 115 }
    ];

    futureDates.forEach(({ key, days }) => {
      const date = new Date(now);
      date.setDate(date.getDate() + days);
      
      // Assign random probabilities for demo
      timeline[key] = 0.3 + (Math.random() * 0.5);
    });

    timeline['total_cuts_in_2026'] = {
      '0': 0.08,
      '1': 0.22,
      '2': 0.34,
      '3+': 0.36
    };

    return timeline;
  }
}

export default new ConsensusService();