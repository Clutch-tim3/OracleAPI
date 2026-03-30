import { MetaculusMarket } from '../types/platform.types';
import { MarketData, Category, MarketStatus } from '../types/market.types';

export function normalizeMetaculusMarket(metaculusMarket: MetaculusMarket): MarketData {
  const probabilityYes = metaculusMarket.community_prediction.full.q2;
  
  return {
    source_platform: 'metaculus',
    source_id: metaculusMarket.id.toString(),
    source_url: `https://www.metaculus.com/questions/${metaculusMarket.id}`,
    title: metaculusMarket.title,
    description: metaculusMarket.description,
    category: determineCategory(metaculusMarket.tags),
    sub_category: undefined,
    tags: metaculusMarket.tags.map(tag => tag.toLowerCase().replace(/\s+/g, '_')),
    market_type: 'binary',
    outcomes: [
      {
        id: 'yes',
        title: 'Yes',
        probability: probabilityYes,
        last_price: probabilityYes,
        volume: metaculusMarket.num_predictions * 10
      },
      {
        id: 'no',
        title: 'No',
        probability: 1 - probabilityYes,
        last_price: 1 - probabilityYes,
        volume: metaculusMarket.num_predictions * 10
      }
    ],
    status: mapStatus(metaculusMarket.status),
    resolution: undefined,
    resolution_source: undefined,
    opens_at: new Date(metaculusMarket.publish_time),
    closes_at: new Date(metaculusMarket.close_time),
    resolved_at: undefined,
    total_volume: metaculusMarket.num_predictions * 10,
    volume_24h: undefined,
    liquidity: metaculusMarket.num_predictions,
    num_traders: metaculusMarket.num_predictions,
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
  const statusMap: Record<string, MarketStatus> = {
    'open': 'open',
    'closed': 'closed',
    'resolved': 'resolved',
    'voided': 'voided'
  };
  
  return statusMap[status.toLowerCase()] || 'open';
}

function determineCategory(tags: string[]): Category {
  const lowerTags = tags.map(tag => tag.toLowerCase());
  
  if (lowerTags.some(tag => tag.includes('politics') || tag.includes('election') || tag.includes('government'))) {
    return 'politics';
  }
  
  if (lowerTags.some(tag => tag.includes('economics') || tag.includes('finance') || tag.includes('market'))) {
    return 'economics';
  }
  
  if (lowerTags.some(tag => tag.includes('technology') || tag.includes('ai') || tag.includes('computer'))) {
    return 'technology';
  }
  
  if (lowerTags.some(tag => tag.includes('science') || tag.includes('space') || tag.includes('research'))) {
    return 'science';
  }
  
  if (lowerTags.some(tag => tag.includes('climate') || tag.includes('weather') || tag.includes('environment'))) {
    return 'climate';
  }
  
  if (lowerTags.some(tag => tag.includes('crypto') || tag.includes('bitcoin') || tag.includes('blockchain'))) {
    return 'crypto';
  }
  
  if (lowerTags.some(tag => tag.includes('sports') || tag.includes('game') || tag.includes('competition'))) {
    return 'sports';
  }
  
  if (lowerTags.some(tag => tag.includes('culture') || tag.includes('entertainment') || tag.includes('media'))) {
    return 'entertainment';
  }
  
  if (lowerTags.some(tag => tag.includes('geopolitics') || tag.includes('war') || tag.includes('international'))) {
    return 'geopolitics';
  }
  
  return 'culture';
}