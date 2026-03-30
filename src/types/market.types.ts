export type Platform = 'kalshi' | 'polymarket' | 'metaculus' | 'manifold';

export type MarketStatus = 'open' | 'closed' | 'resolved' | 'voided';

export type MarketType = 'binary' | 'multiple_choice' | 'scalar';

export type Category = 
  | 'politics' 
  | 'economics' 
  | 'finance' 
  | 'sports' 
  | 'technology' 
  | 'climate' 
  | 'culture' 
  | 'crypto' 
  | 'science' 
  | 'geopolitics' 
  | 'entertainment';

export interface Outcome {
  id: string;
  title: string;
  probability: number;
  last_price: number;
  volume: number;
}

export interface MarketData {
  id?: string;
  source_platform: Platform;
  source_id: string;
  source_url?: string;
  title: string;
  description?: string;
  category: Category;
  sub_category?: string;
  tags: string[];
  market_type: MarketType;
  outcomes: any; // Changed from Outcome[] to any for Prisma compatibility
  status: MarketStatus;
  resolution?: string;
  resolution_source?: string;
  opens_at?: Date;
  closes_at?: Date;
  resolved_at?: Date;
  total_volume?: number;
  volume_24h?: number;
  liquidity?: number;
  num_traders?: number;
  probability_yes?: number;
  probability_change_24h?: number;
  probability_change_7d?: number;
  ai_summary?: string;
  significance_score?: number;
  category_accuracy?: number;
  last_synced?: Date;
  createdAt?: Date;
}

export interface MarketSnapshotData {
  id?: string;
  market_id: string;
  probability_yes: number;
  total_volume?: number;
  liquidity?: number;
  num_traders?: number;
  snapshot_at?: Date;
}

export interface MarketAnalysisData {
  id?: string;
  market_id: string;
  analysis_type: string;
  input_hash: string;
  result: any;
  model_used: string;
  createdAt?: Date;
}

export interface CategoryAccuracyData {
  id?: string;
  category: string;
  platform: string;
  total_resolved: number;
  correctly_called: number;
  brier_score_avg?: number;
  accuracy_pct?: number;
  calibration_data?: any;
  last_updated?: Date;
}

export interface TrendingMarketData {
  id?: string;
  market_id: string;
  trending_score: number;
  reason: string[];
  prob_change_1h?: number;
  prob_change_24h?: number;
  volume_change_24h?: number;
  last_updated?: Date;
}

export interface SyncLogData {
  id?: string;
  source: string;
  sync_type: string;
  markets_synced: number;
  markets_updated: number;
  errors: number;
  duration_ms?: number;
  status: string;
  createdAt?: Date;
}

export interface ApiUsageData {
  id?: string;
  api_key_hash: string;
  tier: string;
  endpoint: string;
  request_weight: number;
  response_status: number;
  duration_ms: number;
  from_cache: boolean;
  createdAt?: Date;
}