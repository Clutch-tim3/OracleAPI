export interface KalshiMarket {
  ticker: string;
  title: string;
  description: string;
  category: string;
  close_time: string;
  yes_bid: number;
  yes_ask: number;
  volume: number;
  open_interest: number;
  status: string;
}

export interface PolymarketMarket {
  condition_id: string;
  question: string;
  outcomes: {
    id: string;
    token_id: string;
    price: number;
    volume: number;
  }[];
  volume24hr: number;
  liquidityNum: number;
  status: string;
}

export interface MetaculusMarket {
  id: number;
  title: string;
  description: string;
  publish_time: string;
  close_time: string;
  community_prediction: {
    full: {
      q2: number;
    };
  };
  num_predictions: number;
  tags: string[];
  status: string;
}

export interface ManifoldMarket {
  id: string;
  question: string;
  description: string;
  createdTime: number;
  closeTime?: number;
  probability: number;
  totalLiquidity: number;
  volume: number;
  creatorUsername: string;
  tags: string[];
  status: string;
}