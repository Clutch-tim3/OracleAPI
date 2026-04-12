import kalshiSync from '../sync/kalshi.sync';
import polymarketSync from '../sync/polymarket.sync';
import metaculusSync from '../sync/metaculus.sync';
import manifoldSync from '../sync/manifold.sync';
import trendingService from '../services/trending.service';

export function scheduleSyncJobs(): void {
  const kalshiInterval    = parseInt(process.env.KALSHI_SYNC_INTERVAL_MS    || '300000');
  const polymarketInterval = parseInt(process.env.POLYMARKET_SYNC_INTERVAL_MS || '300000');
  const metaculusInterval  = parseInt(process.env.METACULUS_SYNC_INTERVAL_MS  || '1800000');
  const manifoldInterval   = parseInt(process.env.MANIFOLD_SYNC_INTERVAL_MS   || '1800000');

  setInterval(() => kalshiSync.syncMarkets().catch(console.error),    kalshiInterval);
  setInterval(() => polymarketSync.syncMarkets().catch(console.error), polymarketInterval);
  setInterval(() => metaculusSync.syncMarkets().catch(console.error),  metaculusInterval);
  setInterval(() => manifoldSync.syncMarkets().catch(console.error),   manifoldInterval);
  setInterval(() => trendingService.updateTrendingMarkets().catch(console.error), 600_000);

  console.log('Sync jobs scheduled');
}

export async function runInitialSync(): Promise<void> {
  console.log('Running initial sync of all platforms');
  await Promise.all([
    kalshiSync.syncMarkets(),
    polymarketSync.syncMarkets(),
    metaculusSync.syncMarkets(),
    manifoldSync.syncMarkets(),
  ]);
  console.log('Initial sync completed');
}
