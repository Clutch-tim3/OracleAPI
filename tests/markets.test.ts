import request from 'supertest';
import { app } from '../src/app';
import marketsService from '../src/services/markets.service';
import trendingService from '../src/services/trending.service';
import consensusService from '../src/services/consensus.service';

// Mock the services
jest.mock('../src/services/markets.service');
jest.mock('../src/services/trending.service');
jest.mock('../src/services/consensus.service');

describe('Markets API', () => {
  describe('GET /v1/markets', () => {
    it('should return a list of markets', async () => {
      const mockMarkets = {
        total: 2,
        returned: 2,
        offset: 0,
        markets: [
          {
            id: '1',
            title: 'Test Market 1',
            probability: { yes: 0.6, formatted: '60% chance YES' },
            source_platform: 'kalshi'
          },
          {
            id: '2',
            title: 'Test Market 2',
            probability: { yes: 0.4, formatted: '40% chance YES' },
            source_platform: 'polymarket'
          }
        ]
      };

      (marketsService.findAll as jest.Mock).mockResolvedValue(mockMarkets);

      const response = await request(app)
        .get('/v1/markets')
        .set('x-rapidapi-key', 'demo-api-key-12345');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockMarkets);
      expect(marketsService.findAll).toHaveBeenCalled();
    });

    it('should return 401 without API key', async () => {
      const response = await request(app)
        .get('/v1/markets');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('API_KEY_MISSING');
    });

    it('should return 401 with invalid API key', async () => {
      const response = await request(app)
        .get('/v1/markets')
        .set('x-rapidapi-key', 'invalid-key');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('API_KEY_INVALID');
    });
  });

  describe('GET /v1/markets/:id', () => {
    it('should return a single market', async () => {
      const mockMarket = {
        id: '1',
        title: 'Test Market',
        probability: { yes: 0.6, formatted: '60% chance YES' }
      };

      (marketsService.findById as jest.Mock).mockResolvedValue(mockMarket);

      const response = await request(app)
        .get('/v1/markets/1')
        .set('x-rapidapi-key', 'demo-api-key-12345');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockMarket);
      expect(marketsService.findById).toHaveBeenCalledWith('1');
    });

    it('should return 404 when market not found', async () => {
      (marketsService.findById as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/v1/markets/999')
        .set('x-rapidapi-key', 'demo-api-key-12345');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MARKET_NOT_FOUND');
    });
  });

  describe('GET /v1/markets/trending', () => {
    it('should return trending markets', async () => {
      const mockTrending = {
        as_of: expect.any(String),
        timeframe: '24h',
        markets: [
          {
            id: '1',
            title: 'Trending Market',
            probability_yes: 0.7
          }
        ]
      };

      (trendingService.getTrendingMarkets as jest.Mock).mockResolvedValue(mockTrending);

      const response = await request(app)
        .get('/v1/markets/trending')
        .set('x-rapidapi-key', 'demo-api-key-12345');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockTrending);
      expect(trendingService.getTrendingMarkets).toHaveBeenCalled();
    });
  });

  describe('GET /v1/markets/consensus', () => {
    it('should return consensus view', async () => {
      const mockConsensus = {
        topic: 'Fed rates',
        markets_found: 2,
        as_of: expect.any(String),
        consensus_view: {
          one_liner: 'Market expects rates to hold'
        },
        market_breakdown: [],
        probability_timeline: {}
      };

      (consensusService.getConsensus as jest.Mock).mockResolvedValue(mockConsensus);

      const response = await request(app)
        .get('/v1/markets/consensus')
        .query({ topic: 'Fed rates' })
        .set('x-rapidapi-key', 'demo-api-key-12345');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockConsensus);
      expect(consensusService.getConsensus).toHaveBeenCalledWith('Fed rates', 10);
    });

    it('should return 400 without topic parameter', async () => {
      const response = await request(app)
        .get('/v1/markets/consensus')
        .set('x-rapidapi-key', 'demo-api-key-12345');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});