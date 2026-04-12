import { ManifoldMarket } from '../types/platform.types';
import { MarketData, Category, MarketStatus } from '../types/market.types';

export function normalizeManifoldMarket(manifoldMarket: ManifoldMarket): MarketData {
  const probabilityYes = manifoldMarket.probability;
  
  return {
    source_platform: 'manifold',
    source_id: manifoldMarket.id,
    source_url: `https://manifold.markets/${manifoldMarket.creatorUsername}/${manifoldMarket.id}`,
    title: manifoldMarket.question,
    description: manifoldMarket.description,
    category: determineCategory(manifoldMarket.question, manifoldMarket.tags),
    sub_category: undefined,
    tags: manifoldMarket.tags.map(tag => tag.toLowerCase().replace(/\s+/g, '_')),
    market_type: 'binary',
    outcomes: [
      {
        id: 'yes',
        title: 'Yes',
        probability: probabilityYes,
        last_price: probabilityYes,
        volume: manifoldMarket.volume / 100
      },
      {
        id: 'no',
        title: 'No',
        probability: 1 - probabilityYes,
        last_price: 1 - probabilityYes,
        volume: manifoldMarket.volume / 100
      }
    ],
    status: mapStatus(manifoldMarket.status),
    resolution: undefined,
    resolution_source: undefined,
    opens_at: new Date(manifoldMarket.createdTime),
    closes_at: manifoldMarket.closeTime ? new Date(manifoldMarket.closeTime) : undefined,
    resolved_at: undefined,
    total_volume: manifoldMarket.volume / 100,
    volume_24h: undefined,
    liquidity: manifoldMarket.totalLiquidity / 100,
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

function mapStatus(status: string): MarketStatus {
  const statusMap: Record<string, string> = {
    'open': 'open',
    'closed': 'closed',
    'resolved': 'resolved',
    'voided': 'voided'
  };

  return (statusMap[status.toLowerCase()] || 'open') as MarketStatus;
}

function determineCategory(question: string, tags: string[]): Category {
  const text = question.toLowerCase();
  const lowerTags = tags.map(tag => tag.toLowerCase());
  
  if (text.includes('election') || text.includes('president') || text.includes('congress') || lowerTags.some(tag => tag.includes('politics'))) {
    return 'politics';
  }
  
  if (text.includes('fed') || text.includes('interest rate') || text.includes('inflation') || text.includes('gdp') || text.includes('recession') || lowerTags.some(tag => tag.includes('economics'))) {
    return 'economics';
  }
  
  if (text.includes('stock') || text.includes('market') || text.includes('crypto') || text.includes('bitcoin') || text.includes('ethereum') || lowerTags.some(tag => tag.includes('crypto'))) {
    return 'finance';
  }
  
  if (text.includes('world cup') || text.includes('super bowl') || text.includes('nba') || text.includes('nfl') || text.includes('mlb') || text.includes('soccer') || lowerTags.some(tag => tag.includes('sports'))) {
    return 'sports';
  }
  
  if (text.includes('ai') || text.includes('technology') || text.includes('apple') || text.includes('google') || text.includes('microsoft') || text.includes('tesla') || lowerTags.some(tag => tag.includes('technology'))) {
    return 'technology';
  }
  
  if (text.includes('climate') || text.includes('weather') || text.includes('global warming') || text.includes('carbon') || lowerTags.some(tag => tag.includes('climate'))) {
    return 'climate';
  }
  
  if (text.includes('movie') || text.includes('oscar') || text.includes('grammy') || text.includes('entertainment') || text.includes('celebrity') || lowerTags.some(tag => tag.includes('entertainment'))) {
    return 'entertainment';
  }
  
  if (text.includes('science') || text.includes('space') || text.includes('nasa') || text.includes('research') || lowerTags.some(tag => tag.includes('science'))) {
    return 'science';
  }
  
  if (text.includes('war') || text.includes('conflict') || text.includes('military') || text.includes('international') || lowerTags.some(tag => tag.includes('geopolitics'))) {
    return 'geopolitics';
  }
  
  return 'culture';
}