import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const demoMarkets = [
  {
    id: 'market_demo_inflation_2026',
    title: 'Will US CPI inflation fall below 3% in 2026?',
    category: 'economics',
    status: 'active' as const,
    source_platform: 'demo',
    source_id: 'market_demo_inflation_2026',
    source_url: 'https://oracleiq.dev/demo/market_demo_inflation_2026',
    market_type: 'binary',
    outcomes: { yes: 'Yes', no: 'No' },
    total_volume: 847230,
    volume_24h: 156000,
    probability_yes: 0.41,
    significance_score: 0.85,
    closes_at: new Date('2026-12-31'),
    description: 'Annual CPI inflation in the United States will be below 3% in 2026.',
  },
  {
    id: 'market_demo_fed_rate_2026',
    title: 'Will the Federal Reserve cut rates before July 2026?',
    category: 'economics',
    status: 'active' as const,
    source_platform: 'demo',
    source_id: 'market_demo_fed_rate_2026',
    source_url: 'https://oracleiq.dev/demo/market_demo_fed_rate_2026',
    market_type: 'binary',
    outcomes: { yes: 'Yes', no: 'No' },
    total_volume: 1234560,
    volume_24h: 280000,
    probability_yes: 0.67,
    significance_score: 0.92,
    closes_at: new Date('2026-06-30'),
    description: 'The Federal Reserve will announce a cut to the federal funds rate before July 1, 2026.',
  },
  {
    id: 'market_demo_btc_100k',
    title: 'Will Bitcoin exceed $100,000 before end of 2026?',
    category: 'crypto',
    status: 'active' as const,
    source_platform: 'demo',
    source_id: 'market_demo_btc_100k',
    source_url: 'https://oracleiq.dev/demo/market_demo_btc_100k',
    market_type: 'binary',
    outcomes: { yes: 'Yes', no: 'No' },
    total_volume: 2891430,
    volume_24h: 520000,
    probability_yes: 0.38,
    significance_score: 0.88,
    closes_at: new Date('2026-12-31'),
    description: 'The price of Bitcoin will exceed $100,000 per BTC before December 31, 2026.',
  },
  {
    id: 'market_demo_ai_regulation',
    title: 'Will the US pass federal AI regulation legislation in 2026?',
    category: 'tech-policy',
    status: 'active' as const,
    source_platform: 'demo',
    source_id: 'market_demo_ai_regulation',
    source_url: 'https://oracleiq.dev/demo/market_demo_ai_regulation',
    market_type: 'binary',
    outcomes: { yes: 'Yes', no: 'No' },
    total_volume: 456780,
    volume_24h: 89000,
    probability_yes: 0.22,
    significance_score: 0.78,
    closes_at: new Date('2026-12-31'),
    description: 'The United States Congress will pass federal legislation regulating artificial intelligence in 2026.',
  },
  {
    id: 'market_demo_resolved_example',
    title: 'Did the Federal Reserve raise rates in March 2026?',
    category: 'economics',
    status: 'resolved' as const,
    source_platform: 'demo',
    source_id: 'market_demo_resolved_example',
    source_url: 'https://oracleiq.dev/demo/market_demo_resolved_example',
    market_type: 'binary',
    outcomes: { yes: 'Yes', no: 'No' },
    total_volume: 3200000,
    volume_24h: 0,
    probability_yes: 1.0,
    significance_score: 0.95,
    closes_at: new Date('2026-03-31'),
    resolved_at: new Date('2026-03-31'),
    resolution: 'yes',
    description: 'The Federal Reserve raised the federal funds rate by 25 basis points in March 2026.',
  },
];

export async function seedDemoMarkets() {
  const shouldSeed = process.env.DEMO_SEED_ON_STARTUP === 'true' || process.env.NODE_ENV === 'development';

  if (!shouldSeed) {
    console.log('Demo markets seeding disabled');
    return;
  }

  try {
    // Check if there are any existing markets
    const existingMarketsCount = await prisma.market.count();
    const shouldSeedDemo = existingMarketsCount === 0;

    if (shouldSeedDemo) {
      console.log('Seeding demo markets...');
      await prisma.market.createMany({
        data: demoMarkets,
      });
      console.log(`Successfully seeded ${demoMarkets.length} demo markets`);
    } else {
      console.log('Skipping demo markets seeding - existing markets found');
    }
  } catch (error) {
    console.error('Error seeding demo markets:', error);
  }
}

// Call the seed function directly if this file is run directly
if (require.main === module) {
  seedDemoMarkets()
    .catch((error) => {
      console.error('Error seeding demo markets:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}