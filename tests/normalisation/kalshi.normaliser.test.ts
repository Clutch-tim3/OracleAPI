import { normalizeKalshiMarket } from '../../src/normalisation/kalshi.normaliser';

describe('Kalshi Normalizer', () => {
  const sampleKalshiMarket = {
    ticker: 'FED-RATE-MAR',
    title: 'Will the Fed cut rates at the March 2026 FOMC meeting?',
    description: 'Federal Reserve interest rate decision',
    category: 'economics',
    close_time: '2026-03-20T18:00:00Z',
    yes_bid: 33,
    yes_ask: 35,
    volume: 2847320,
    open_interest: 1500000,
    status: 'open'
  };

  it('should normalize basic market data', () => {
    const normalized = normalizeKalshiMarket(sampleKalshiMarket);
    
    expect(normalized.source_platform).toBe('kalshi');
    expect(normalized.source_id).toBe('FED-RATE-MAR');
    expect(normalized.source_url).toBe('https://kalshi.com/markets/FED-RATE-MAR');
    expect(normalized.title).toBe(sampleKalshiMarket.title);
    expect(normalized.category).toBe('economics');
    expect(normalized.market_type).toBe('binary');
    expect(normalized.status).toBe('open');
    expect(normalized.closes_at).toEqual(new Date('2026-03-20T18:00:00Z'));
  });

  it('should calculate correct probability', () => {
    const normalized = normalizeKalshiMarket(sampleKalshiMarket);
    expect(normalized.probability_yes).toBe(0.34); // (33 + 35) / 2 / 100
  });

  it('should normalize outcomes correctly', () => {
    const normalized = normalizeKalshiMarket(sampleKalshiMarket);
    expect(normalized.outcomes).toEqual([
      {
        id: 'yes',
        title: 'Yes',
        probability: 0.34,
        last_price: 0.34,
        volume: 2847320
      },
      {
        id: 'no',
        title: 'No',
        probability: 0.66,
        last_price: 0.66,
        volume: 2847320
      }
    ]);
  });

  it('should extract relevant tags', () => {
    const normalized = normalizeKalshiMarket(sampleKalshiMarket);
    expect(normalized.tags).toEqual(expect.arrayContaining(['fed', 'federal_reserve']));
  });

  it('should handle different categories', () => {
    const politicalMarket = {
      ...sampleKalshiMarket,
      category: 'politics',
      title: 'Will Biden be re-elected?'
    };

    const normalized = normalizeKalshiMarket(politicalMarket);
    expect(normalized.category).toBe('politics');
  });
});