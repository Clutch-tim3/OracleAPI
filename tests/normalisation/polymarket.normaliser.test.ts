import { normalizePolymarketMarket } from '../../src/normalisation/polymarket.normaliser';

describe('Polymarket Normalizer', () => {
  const samplePolymarketMarket = {
    condition_id: 'fed-rate-cut-march-2026',
    question: 'Will the Fed cut rates in March 2026?',
    outcomes: [
      { id: 'yes', token_id: 'yes-token', price: 0.31, volume: 1248000 },
      { id: 'no', token_id: 'no-token', price: 0.69, volume: 1600000 }
    ],
    volume24hr: 847300,
    liquidityNum: 150000,
    status: 'active'
  };

  it('should normalize basic market data', () => {
    const normalized = normalizePolymarketMarket(samplePolymarketMarket);
    
    expect(normalized.source_platform).toBe('polymarket');
    expect(normalized.source_id).toBe('fed-rate-cut-march-2026');
    expect(normalized.source_url).toBe('https://polymarket.com/markets/fed-rate-cut-march-2026');
    expect(normalized.title).toBe(samplePolymarketMarket.question);
    expect(normalized.market_type).toBe('binary');
    expect(normalized.status).toBe('open');
  });

  it('should extract correct probability', () => {
    const normalized = normalizePolymarketMarket(samplePolymarketMarket);
    expect(normalized.probability_yes).toBe(0.31);
  });

  it('should normalize outcomes correctly', () => {
    const normalized = normalizePolymarketMarket(samplePolymarketMarket);
    
    expect(normalized.outcomes).toEqual([
      {
        id: 'yes',
        title: 'Yes',
        probability: 0.31,
        last_price: 0.31,
        volume: 1248000
      },
      {
        id: 'no',
        title: 'No',
        probability: 0.69,
        last_price: 0.69,
        volume: 1600000
      }
    ]);
  });

  it('should handle multi-outcome markets', () => {
    const multiOutcomeMarket = {
      ...samplePolymarketMarket,
      question: 'Fed rate cut size',
      outcomes: [
        { id: '25bps', price: 0.5, volume: 100000 },
        { id: '50bps', price: 0.3, volume: 80000 },
        { id: '75bps', price: 0.2, volume: 50000 }
      ]
    };

    const normalized = normalizePolymarketMarket(multiOutcomeMarket);
    
    expect(normalized.market_type).toBe('multiple_choice');
    expect(normalized.probability_yes).toBeUndefined();
  });

  it('should categorize markets correctly', () => {
    const politicalMarket = {
      ...samplePolymarketMarket,
      question: 'Will Biden win the 2026 election?'
    };
    
    const normalized = normalizePolymarketMarket(politicalMarket);
    expect(normalized.category).toBe('politics');
  });
});