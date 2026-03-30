import { SemanticSearchResponse } from '../types/api.types';
import prisma from '../config/database';

export class SemanticSearchService {
  async searchMarkets(query: string, limit: number = 10): Promise<SemanticSearchResponse> {
    // For this implementation, we'll use simple keyword matching
    // In production, this would use AI for natural language understanding
    const interpretation = this.interpretQuery(query);
    const searchTerms = this.extractSearchTerms(query);

    const markets = await prisma.market.findMany({
      where: {
        status: 'open',
        OR: [
          { title: { contains: searchTerms[0], mode: 'insensitive' } },
          { description: { contains: searchTerms[0], mode: 'insensitive' } },
          { tags: { hasSome: searchTerms } }
        ]
      },
      take: limit
    });

    return {
      query: query,
      interpretation: interpretation,
      markets: markets.map((market, index) => ({
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
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('recession')) {
      return 'User is asking about US economic recession probability';
    } else if (lowerQuery.includes('fed') || lowerQuery.includes('interest rate')) {
      return 'User is asking about Federal Reserve monetary policy';
    } else if (lowerQuery.includes('election')) {
      return 'User is asking about election outcomes';
    } else if (lowerQuery.includes('bitcoin') || lowerQuery.includes('crypto')) {
      return 'User is asking about cryptocurrency price movements';
    } else if (lowerQuery.includes('ai') || lowerQuery.includes('artificial intelligence')) {
      return 'User is asking about artificial intelligence developments';
    }
    
    return `User is asking about "${query}"`;
  }

  private extractSearchTerms(query: string): string[] {
    const terms = query.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(term => term.length > 2 && !['how', 'what', 'when', 'where', 'why', 'will', 'the', 'a', 'an'].includes(term));
    
    return terms.slice(0, 5);
  }

  private getRelevanceExplanation(market: any, query: string): string {
    const queryLower = query.toLowerCase();
    const titleLower = market.title.toLowerCase();
    
    if (titleLower.includes(queryLower)) {
      return 'Direct match - this market directly addresses the query';
    }
    
    const queryTerms = this.extractSearchTerms(query);
    const titleTerms = titleLower.split(/\s+/);
    
    const matchingTerms = queryTerms.filter(term => 
      titleTerms.some(titleTerm => titleTerm.includes(term))
    );
    
    if (matchingTerms.length > 0) {
      return `Relevant keywords match: ${matchingTerms.join(', ')}`;
    }
    
    return 'Market is potentially related to the query topic';
  }
}

export default new SemanticSearchService();