import { KalshiMarket } from '../types/platform.types';
import { MarketData, Category, MarketStatus } from '../types/market.types';

const categoryMapping: Record<string, Category> = {
  'economics': 'economics',
  'politics': 'politics',
  'sports': 'sports',
  'weather': 'climate',
  'financials': 'finance',
};

export function normalizeKalshiMarket(kalshiMarket: KalshiMarket): MarketData {
  const probabilityYes = (kalshiMarket.yes_bid + kalshiMarket.yes_ask) / 2 / 100;
  
  return {
    source_platform: 'kalshi',
    source_id: kalshiMarket.ticker,
    source_url: `https://kalshi.com/markets/${kalshiMarket.ticker}`,
    title: kalshiMarket.title,
    description: kalshiMarket.description,
    category: categoryMapping[kalshiMarket.category.toLowerCase()] || 'other',
    sub_category: undefined,
    tags: extractTags(kalshiMarket.title, kalshiMarket.description),
    market_type: 'binary',
    outcomes: [
      {
        id: 'yes',
        title: 'Yes',
        probability: probabilityYes,
        last_price: probabilityYes,
        volume: kalshiMarket.volume
      },
      {
        id: 'no',
        title: 'No',
        probability: 1 - probabilityYes,
        last_price: 1 - probabilityYes,
        volume: kalshiMarket.volume
      }
    ],
    status: mapStatus(kalshiMarket.status),
    resolution: undefined,
    resolution_source: undefined,
    opens_at: undefined,
    closes_at: new Date(kalshiMarket.close_time),
    resolved_at: undefined,
    total_volume: kalshiMarket.volume,
    volume_24h: undefined,
    liquidity: kalshiMarket.open_interest,
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
  const statusMap: Record<string, MarketStatus> = {
    'open': 'open',
    'closed': 'closed',
    'resolved': 'resolved',
    'voided': 'voided'
  };
  
  return statusMap[status.toLowerCase()] || 'open';
}

function extractTags(title: string, description: string): string[] {
  const text = `${title} ${description}`.toLowerCase();
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