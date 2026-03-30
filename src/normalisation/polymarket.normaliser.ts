import { PolymarketMarket } from '../types/platform.types';
import { MarketData, Category } from '../types/market.types';

export function normalizePolymarketMarket(polymarketMarket: PolymarketMarket): MarketData {
  let probabilityYes: number | undefined; // Changed from number to number | undefined
  const outcomes = polymarketMarket.outcomes.map(outcome => ({
    id: outcome.id,
    title: getOutcomeTitle(outcome.id),
    probability: outcome.price,
    last_price: outcome.price,
    volume: outcome.volume
  }));

  if (polymarketMarket.outcomes.length === 2) {
    probabilityYes = polymarketMarket.outcomes.find(o => o.id.toLowerCase().includes('yes') || o.token_id.toLowerCase().includes('yes'))?.price || polymarketMarket.outcomes[0].price;
  } else {
    probabilityYes = undefined;
  }

  const category = determineCategory(polymarketMarket.question);

  return {
    source_platform: 'polymarket',
    source_id: polymarketMarket.condition_id,
    source_url: `https://polymarket.com/markets/${polymarketMarket.condition_id}`,
    title: polymarketMarket.question,
    description: undefined,
    category,
    sub_category: undefined,
    tags: extractTags(polymarketMarket.question),
    market_type: polymarketMarket.outcomes.length > 2 ? 'multiple_choice' : 'binary',
    outcomes,
    status: mapStatus(polymarketMarket.status),
    resolution: undefined,
    resolution_source: undefined,
    opens_at: undefined,
    closes_at: undefined,
    resolved_at: undefined,
    total_volume: undefined,
    volume_24h: polymarketMarket.volume24hr,
    liquidity: polymarketMarket.liquidityNum,
    num_traders: undefined,
    probability_yes: probabilityYes,
    probability_change_24h: undefined,
    probability_change_7d: undefined,
    ai_summary: undefined,
    significance_score: undefined,
    category_accuracy: undefined,
    last_synced: new Date(),
    createdAt: new Date()
  };
}

function mapStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'active': 'open',
    'closed': 'closed',
    'resolved': 'resolved',
    'voided': 'voided'
  };
  
  return statusMap[status.toLowerCase()] || 'open';
}

function determineCategory(question: string): Category {
  const text = question.toLowerCase();
  
  if (text.includes('election') || text.includes('president') || text.includes('congress') || text.includes('senate') || text.includes('house')) {
    return 'politics';
  }
  
  if (text.includes('fed') || text.includes('interest rate') || text.includes('inflation') || text.includes('gdp') || text.includes('recession')) {
    return 'economics';
  }
  
  if (text.includes('stock') || text.includes('market') || text.includes('crypto') || text.includes('bitcoin') || text.includes('ethereum')) {
    return 'finance';
  }
  
  if (text.includes('world cup') || text.includes('super bowl') || text.includes('nba') || text.includes('nfl') || text.includes('mlb') || text.includes('soccer')) {
    return 'sports';
  }
  
  if (text.includes('ai') || text.includes('technology') || text.includes('apple') || text.includes('google') || text.includes('microsoft') || text.includes('tesla')) {
    return 'technology';
  }
  
  if (text.includes('climate') || text.includes('weather') || text.includes('global warming') || text.includes('carbon')) {
    return 'climate';
  }
  
  if (text.includes('movie') || text.includes('oscar') || text.includes('grammy') || text.includes('entertainment') || text.includes('celebrity')) {
    return 'entertainment';
  }
  
  if (text.includes('science') || text.includes('space') || text.includes('nasa') || text.includes('research')) {
    return 'science';
  }
  
  if (text.includes('war') || text.includes('conflict') || text.includes('military') || text.includes('international')) {
    return 'geopolitics';
  }
  
  return 'culture';
}

function extractTags(question: string): string[] {
  const text = question.toLowerCase();
  const tags: string[] = [];
  
  const tagMap: Record<string, string[]> = {
    'fed': ['federal_reserve', 'fed'],
    'interest rate': ['interest_rates'],
    'inflation': ['inflation'],
    'gdp': ['gdp'],
    'election': ['election'],
    'president': ['president'],
    'congress': ['congress'],
    'senate': ['senate'],
    'house': ['house_of_representatives'],
    'crypto': ['crypto'],
    'bitcoin': ['bitcoin'],
    'ethereum': ['ethereum'],
    'stock market': ['stock_market'],
    'recession': ['recession']
  };
  
  Object.entries(tagMap).forEach(([keyword, tagList]) => {
    if (text.includes(keyword)) {
      tags.push(...tagList);
    }
  });
  
  return Array.from(new Set(tags));
}

function getOutcomeTitle(outcomeId: string): string {
  const lowerId = outcomeId.toLowerCase();
  if (lowerId.includes('yes') || lowerId.includes('y')) return 'Yes';
  if (lowerId.includes('no') || lowerId.includes('n')) return 'No';
  return outcomeId;
}