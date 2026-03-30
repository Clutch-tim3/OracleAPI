import prisma from '../config/database';
import { formatProbabilityChange, formatCurrency } from '../utils/formatting';

export class TrendingService {
  async getTrendingMarkets(params: any): Promise<any> {
    const {
      category,
      platform,
      timeframe = '24h',
      limit = 20
    } = params;

    let where: any = {};
    
    if (category) {
      where.market = {
        category: category
      };
    }

    if (platform && platform !== 'all') {
      where.market = {
        ...where.market,
        source_platform: platform
      };
    }

    const trendingMarkets = await prisma.trendingMarket.findMany({
      where,
      orderBy: { trending_score: 'desc' },
      take: limit,
      include: {
        market: true
      }
    });

    return {
      as_of: new Date().toISOString(),
      timeframe,
      markets: trendingMarkets.map((tm, index) => ({
        trending_rank: index + 1,
        id: tm.market.id,
        title: tm.market.title,
        category: tm.market.category,
        platform: tm.market.source_platform,
        probability_yes: tm.market.probability_yes,
        probability_change_24h: tm.prob_change_24h,
        change_formatted: formatProbabilityChange(tm.prob_change_24h || 0),
        volume_24h: tm.market.volume_24h,
        volume_24h_formatted: formatCurrency(tm.market.volume_24h || 0),
        trending_reasons: tm.reason,
        significance_score: tm.market.significance_score
      }))
    };
  }

  async updateTrendingMarkets(): Promise<void> {
    // Calculate trending scores based on:
    // - Probability change (40%)
    // - Volume change (30%)
    // - New trader activity (20%)
    // - Recency (10%)

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Get markets with recent probability changes
    const markets = await prisma.market.findMany({
      where: {
        status: 'open',
        last_synced: { gte: oneDayAgo }
      },
      include: {
        snapshots: true
      }
    });

    const trendingUpdates = [];

    for (const market of markets) {
      const recentSnapshots = market.snapshots.filter(s => 
        s.snapshot_at >= oneDayAgo
      ).sort((a, b) => a.snapshot_at.getTime() - b.snapshot_at.getTime());

      if (recentSnapshots.length < 2) continue;

      const probChange24h = recentSnapshots[recentSnapshots.length - 1].probability_yes - 
                          recentSnapshots[0].probability_yes;
      
      let probChange1h = 0;
      const oneHourSnapshots = recentSnapshots.filter(s => s.snapshot_at >= oneHourAgo);
      if (oneHourSnapshots.length > 1) {
        probChange1h = oneHourSnapshots[oneHourSnapshots.length - 1].probability_yes - 
                     oneHourSnapshots[0].probability_yes;
      }

      // Calculate volume change (proxy)
      const volumeChange24h = market.volume_24h || 0;

      // Calculate trending score
      const trendingScore = 
        (Math.abs(probChange1h) * 40) + 
        (Math.min(volumeChange24h / 10000, 1) * 30) + 
        (0.5 * 20) +  // New trader activity proxy
        (1 * 10);     // Recency bonus

      const reasons = this.determineTrendingReasons(probChange1h, probChange24h, volumeChange24h);

      trendingUpdates.push({
        market_id: market.id,
        trending_score: trendingScore,
        reason: reasons,
        prob_change_1h: probChange1h,
        prob_change_24h: probChange24h,
        volume_change_24h: volumeChange24h,
        last_updated: new Date()
      });
    }

    // Update trending markets
    for (const update of trendingUpdates) {
      await prisma.trendingMarket.upsert({
        where: { market_id: update.market_id },
        update: update,
        create: update
      });
    }

    // Keep only top 100 trending markets
    const topTrending = await prisma.trendingMarket.findMany({
      orderBy: { trending_score: 'desc' },
      take: 100
    });

    const topIds = topTrending.map(t => t.market_id);
    await prisma.trendingMarket.deleteMany({
      where: { market_id: { notIn: topIds } }
    });
  }

  private determineTrendingReasons(
    probChange1h: number, 
    probChange24h: number, 
    volumeChange24h: number
  ): string[] {
    const reasons: string[] = [];

    if (Math.abs(probChange1h) > 0.05) {
      reasons.push('Largest 1-hour move');
    }

    if (Math.abs(probChange24h) > 0.10) {
      reasons.push('Significant 24-hour move');
    }

    if (volumeChange24h > 500000) {
      reasons.push('High trading volume');
    }

    if (reasons.length === 0) {
      reasons.push('Recent market activity');
    }

    return reasons;
  }
}

export default new TrendingService();