export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: any;
  meta: {
    request_id: string;
    version: string;
    processing_ms: number;
    from_cache: boolean;
    data_freshness: string;
  };
}

export interface PaginatedResponse<T> {
  total: number;
  returned: number;
  offset: number;
  markets: T[];
}

export interface MarketListItem {
  id: string;
  source_platform: string;
  source_id: string;
  source_url?: string;
  title: string;
  category: string;
  sub_category?: string;
  tags: string[];
  market_type: string;
  status: string;
  closes_at: string;
  closes_in: string;
  probability: {
    yes: number;
    no: number;
    yes_pct: number;
    no_pct: number;
    formatted: string;
  };
  movement: {
    change_24h: number;
    change_24h_formatted: string;
    change_7d: number;
    direction: string;
    velocity: string;
  };
  volume: {
    total: number;
    formatted: string;
    last_24h: number;
    last_24h_formatted: string;
  };
  significance_score: number;
  trending_rank: number;
  platform_logo_url: string;
}

export interface MarketDetail extends MarketListItem {
  outcomes: any[];
  probability_history: {
    timestamp: string;
    probability: number;
  }[];
  related_markets: {
    id: string;
    title: string;
    platform: string;
    probability_yes: number;
    relationship: string;
  }[];
  cross_platform: {
    same_question_other_platforms: {
      platform: string;
      title: string;
      probability_yes: number;
      price_difference: number;
      note: string;
    }[];
  };
  embed: {
    widget_url: string;
    iframe_code: string;
    script_tag: string;
  };
}

export interface AnalysisRequest {
  analysis_depth: 'quick' | 'standard' | 'deep';
  perspective: 'neutral' | 'bull' | 'bear';
  audience: 'general' | 'trader' | 'journalist' | 'researcher';
  include_historical_context: boolean;
  include_price_drivers: boolean;
  include_scenarios: boolean;
}

export interface AnalysisResponse {
  market_id: string;
  analysis: {
    headline: string;
    executive_summary: string;
    why_this_probability: string;
    what_would_move_it: {
      higher: string[];
      lower: string[];
    };
    historical_context: string;
    scenarios: {
      YES_scenario: string;
      NO_scenario: string;
    };
    calibration_note: string;
  };
}

export interface TrendingMarket {
  trending_rank: number;
  id: string;
  title: string;
  category: string;
  platform: string;
  probability_yes: number;
  probability_change_24h: number;
  change_formatted: string;
  volume_24h: number;
  volume_24h_formatted: string;
  trending_reasons: string[];
  significance_score: number;
}

export interface ConsensusResponse {
  topic: string;
  markets_found: number;
  as_of: string;
  consensus_view: {
    one_liner: string;
    confidence: string;
    confidence_basis: string;
    narrative: string;
  };
  market_breakdown: {
    title: string;
    probability_yes: number;
    closes_in: string;
    volume: string;
  }[];
  probability_timeline: {
    next_cut_by_march?: number;
    next_cut_by_may?: number;
    next_cut_by_june?: number;
    total_cuts_in_2026?: {
      [key: string]: number;
    };
  };
}

export interface SemanticSearchResponse {
  query: string;
  interpretation: string;
  markets: {
    relevance_score: number;
    relevance_explanation: string;
    title: string;
    probability_yes: number;
    volume: string;
    platform: string;
  }[];
}

export interface PortfolioPosition {
  market_id: string;
  side: 'yes' | 'no';
  entry_probability: number;
  stake: number;
  entry_date: string;
}

export interface PortfolioSimulationRequest {
  positions: PortfolioPosition[];
  cash_balance: number;
  include_pnl: boolean;
  include_expected_value: boolean;
}

export interface PortfolioSimulationResponse {
  portfolio_summary: {
    total_staked: number;
    cash_balance: number;
    total_portfolio_value: number;
    current_unrealised_pnl: number;
    unrealised_pnl_pct: number;
  };
  positions: {
    market_title: string;
    side: 'yes' | 'no';
    entry_probability: number;
    current_probability: number;
    stake: number;
    current_value: number;
    unrealised_pnl: number;
    pnl_pct: number;
    expected_value: {
      if_yes: number;
      if_no: number;
      ev_at_current_price: number;
      interpretation: string;
    };
    market_status: string;
    closes_in: string;
  }[];
}