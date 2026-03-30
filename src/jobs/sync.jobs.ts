import { Worker } from 'bullmq';
import kalshiSync from '../sync/kalshi.sync';
import polymarketSync from '../sync/polymarket.sync';
import metaculusSync from '../sync/metaculus.sync';
import manifoldSync from '../sync/manifold.sync';
import trendingService from '../services/trending.service';
import { syncQueue, analysisQueue, trendingQueue, accuracyQueue, significanceQueue } from '../config/bullmq';

// Kalshi sync job
export const kalshiSyncWorker = new Worker('kalshi-sync', async () => {
  console.log('Processing Kalshi sync job');
  const result = await kalshiSync.syncMarkets();
  console.log(`Kalshi sync result: ${JSON.stringify(result)}`);
  return result;
}, { connection: syncQueue.opts.connection });

// Polymarket sync job
export const polymarketSyncWorker = new Worker('polymarket-sync', async () => {
  console.log('Processing Polymarket sync job');
  const result = await polymarketSync.syncMarkets();
  console.log(`Polymarket sync result: ${JSON.stringify(result)}`);
  return result;
}, { connection: syncQueue.opts.connection });

// Metaculus sync job
export const metaculusSyncWorker = new Worker('metaculus-sync', async () => {
  console.log('Processing Metaculus sync job');
  const result = await metaculusSync.syncMarkets();
  console.log(`Metaculus sync result: ${JSON.stringify(result)}`);
  return result;
}, { connection: syncQueue.opts.connection });

// Manifold sync job
export const manifoldSyncWorker = new Worker('manifold-sync', async () => {
  console.log('Processing Manifold sync job');
  const result = await manifoldSync.syncMarkets();
  console.log(`Manifold sync result: ${JSON.stringify(result)}`);
  return result;
}, { connection: syncQueue.opts.connection });

// Trending markets compute job
export const trendingComputeWorker = new Worker('trending-compute', async () => {
  console.log('Processing trending markets compute job');
  await trendingService.updateTrendingMarkets();
  console.log('Trending markets compute completed');
  return { success: true };
}, { connection: trendingQueue.opts.connection });

// Analysis job (placeholder)
export const analysisWorker = new Worker('market-analysis', async (job) => {
  console.log('Processing market analysis job');
  const { marketId, request } = job.data;
  console.log(`Analyzing market: ${marketId}`);
  return { success: true };
}, { connection: analysisQueue.opts.connection });

// Schedule sync jobs
export function scheduleSyncJobs(): void {
  const kalshiInterval = parseInt(process.env.KALSHI_SYNC_INTERVAL_MS || '300000'); // 5 minutes
  const polymarketInterval = parseInt(process.env.POLYMARKET_SYNC_INTERVAL_MS || '300000'); // 5 minutes
  const metaculusInterval = parseInt(process.env.METACULUS_SYNC_INTERVAL_MS || '1800000'); // 30 minutes
  const manifoldInterval = parseInt(process.env.MANIFOLD_SYNC_INTERVAL_MS || '1800000'); // 30 minutes

  // Kalshi sync every 5 minutes
  setInterval(() => {
    syncQueue.add('kalshi-sync', {}, { removeOnComplete: 5, removeOnFail: 5 });
  }, kalshiInterval);

  // Polymarket sync every 5 minutes
  setInterval(() => {
    syncQueue.add('polymarket-sync', {}, { removeOnComplete: 5, removeOnFail: 5 });
  }, polymarketInterval);

  // Metaculus sync every 30 minutes
  setInterval(() => {
    syncQueue.add('metaculus-sync', {}, { removeOnComplete: 5, removeOnFail: 5 });
  }, metaculusInterval);

  // Manifold sync every 30 minutes
  setInterval(() => {
    syncQueue.add('manifold-sync', {}, { removeOnComplete: 5, removeOnFail: 5 });
  }, manifoldInterval);

  // Trending markets compute every 10 minutes
  setInterval(() => {
    trendingQueue.add('trending-compute', {}, { removeOnComplete: 5, removeOnFail: 5 });
  }, 600000); // 10 minutes

  console.log('Sync jobs scheduled');
}

export async function runInitialSync(): Promise<void> {
  console.log('Running initial sync of all platforms');
  
  await Promise.all([
    kalshiSync.syncMarkets(),
    polymarketSync.syncMarkets(),
    metaculusSync.syncMarkets(),
    manifoldSync.syncMarkets()
  ]);
  
  console.log('Initial sync completed');
}