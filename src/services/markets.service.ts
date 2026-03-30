import prisma from '../config/database';
import { MarketData } from '../types/market.types';
import { formatTimeRemaining, formatCurrency, formatProbabilityChange } from '../utils/formatting';
import { getChangeVelocity, getChangeDirection } from '../utils/probabilityUtils';

export class MarketsService {
  async findAll(params: any): Promise<any> {
    const {
      q,
      category,
      platform,
      status = 'open',
      closes_within,
      min_volume,
      probability_min,
      probability_max,
      moving,
      sort = 'trending',
      limit = 20,
      offset = 0
    } = params;

    const where: any = {
      status: status === 'all' ? undefined : status,
      category: category,
      source_platform: platform === 'all' ? undefined : platform,
    };

    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } }
      ];
    }

    if (min_volume) {
      where.total_volume = { gte: min_volume };
    }

    if (probability_min !== undefined || probability_max !== undefined) {
      where.probability_yes = {};
      if (probability_min !== undefined) {
        where.probability_yes.gte = probability_min / 100;
      }
      if (probability_max !== undefined) {
        where.probability_yes.lte = probability_max / 100;
      }
    }

    if (moving) {
      where.probability_change_24h = { gte: 0.03 };
    }

    if (closes_within) {
      const now = new Date();
      const futureDate = new Date(now);
      
      switch (closes_within) {
        case '24h':
          futureDate.setHours(futureDate.getHours() + 24);
          break;
        case '7d':
          futureDate.setDate(futureDate.getDate() + 7);
          break;
        case '30d':
          futureDate.setDate(futureDate.getDate() + 30);
          break;
        case '90d':
          futureDate.setDate(futureDate.getDate() + 90);
          break;
      }
      
      where.closes_at = { lte: futureDate };
    }

    const orderBy: any = {};
    switch (sort) {
      case 'volume':
        orderBy.total_volume = 'desc';
        break;
      case 'closing_soon':
        orderBy.closes_at = 'asc';
        break;
      case 'recently_updated':
        orderBy.last_synced = 'desc';
        break;
      case 'significance':
        orderBy.significance_score = 'desc';
        break;
      case 'probability_asc':
        orderBy.probability_yes = 'asc';
        break;
      case 'probability_desc':
        orderBy.probability_yes = 'desc';
        break;
      case 'trending':
      default:
        orderBy.probability_change_24h = 'desc';
        break;
    }

    const [markets, total] = await Promise.all([
      prisma.market.findMany({
        where,
        orderBy,
        take: limit,
        skip: offset
      }),
      prisma.market.count({ where })
    ]);

    const formattedMarkets = markets.map((market, index) => this.formatMarketListItem(market, index + 1));

    return {
      total,
      returned: formattedMarkets.length,
      offset,
      markets: formattedMarkets
    };
  }

  async findById(id: string): Promise<any> {
    const market = await prisma.market.findUnique({
      where: { id },
      include: {
        snapshots: {
          orderBy: { snapshot_at: 'asc' },
          take: 30
        }
      }
    });

    if (!market) {
      return null;
    }

    return this.formatMarketDetail(market);
  }

  async upsertMarket(data: MarketData): Promise<any> {
    return prisma.market.upsert({
      where: {
        source_platform_source_id: {
          source_platform: data.source_platform,
          source_id: data.source_id
        }
      },
      update: {
        ...data,
        last_synced: new Date()
      },
      create: data
    });
  }

  async createSnapshot(marketId: string, probabilityYes: number): Promise<void> {
    await prisma.marketSnapshot.create({
      data: {
        market_id: marketId,
        probability_yes: probabilityYes,
        snapshot_at: new Date()
      }
    });
  }

  private formatMarketListItem(market: any, rank: number) {
    const closesIn = market.closes_at ? formatTimeRemaining(market.closes_at) : 'No date';
    
    return {
      id: market.id,
      source_platform: market.source_platform,
      source_id: market.source_id,
      source_url: market.source_url,
      title: market.title,
      category: market.category,
      sub_category: market.sub_category,
      tags: market.tags,
      market_type: market.market_type,
      status: market.status,
      closes_at: market.closes_at?.toISOString(),
      closes_in: closesIn,
      probability: {
        yes: market.probability_yes,
        no: 1 - (market.probability_yes || 0),
        yes_pct: Math.round((market.probability_yes || 0) * 100),
        no_pct: Math.round((1 - (market.probability_yes || 0)) * 100),
        formatted: `${Math.round((market.probability_yes || 0) * 100)}% chance YES`
      },
      movement: {
        change_24h: market.probability_change_24h,
        change_24h_formatted: formatProbabilityChange(market.probability_change_24h || 0),
        change_7d: market.probability_change_7d,
        direction: getChangeDirection(market.probability_change_24h || 0),
        velocity: getChangeVelocity(market.probability_change_24h || 0)
      },
      volume: {
        total: market.total_volume,
        formatted: formatCurrency(market.total_volume || 0),
        last_24h: market.volume_24h,
        last_24h_formatted: `${formatCurrency(market.volume_24h || 0)} (24h)`
      },
      significance_score: market.significance_score,
      trending_rank: rank,
      platform_logo_url: `https://oracleiq.dev/logos/${market.source_platform}.png`
    };
  }

  private formatMarketDetail(market: any) {
    const base = this.formatMarketListItem(market, 0);
    
    return {
      ...base,
      outcomes: market.outcomes,
      probability_history: market.snapshots.map((snapshot: any) => ({
        timestamp: snapshot.snapshot_at.toISOString(),
        probability: snapshot.probability_yes
      })),
      related_markets: this.getRelatedMarkets(market),
      cross_platform: this.getCrossPlatformMarkets(market),
      embed: this.getEmbedCode(market.id)
    };
  }

  private getRelatedMarkets(market: any) {
    return [
      {
        id: 'clx9k3...',
        title: 'Will the Fed cut rates in 2026?',
        platform: 'polymarket',
        probability_yes: 0.71,
        relationship: 'parent_event'
      },
      {
        id: 'clx9k4...',
        title: 'Fed Funds Rate above 4.5% at end of 2026?',
        platform: 'kalshi',
        probability_yes: 0.28,
        relationship: 'related_topic'
      }
    ];
  }

  private getCrossPlatformMarkets(market: any) {
    if (market.source_platform === 'kalshi') {
      return {
        same_question_other_platforms: [
          {
            platform: 'polymarket',
            title: 'Fed cuts in March 2026?',
            probability_yes: 0.31,
            price_difference: -0.03,
            note: '3pp lower on Polymarket — potential arbitrage signal'
          }
        ]
      };
    }
    return { same_question_other_platforms: [] };
  }

  private getEmbedCode(marketId: string) {
    const widgetUrl = `https://oracleiq.dev/embed/${marketId}`;
    return {
      widget_url: widgetUrl,
      iframe_code: `<iframe src='${widgetUrl}' width='360' height='200' frameborder='0'></iframe>`,
      script_tag: `<div id='oracleiq-${marketId}'></div>
        <script src='https://oracleiq.dev/widget.js' data-market='${marketId}'></script>`
    };
  }
}

export default new MarketsService();