import { Queue, Worker, ConnectionOptions } from 'bullmq';
import redis from './redis';

const connection: ConnectionOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
};

export const syncQueue = new Queue('sync-jobs', { connection });
export const analysisQueue = new Queue('analysis-jobs', { connection });
export const trendingQueue = new Queue('trending-jobs', { connection });
export const accuracyQueue = new Queue('accuracy-jobs', { connection });
export const significanceQueue = new Queue('significance-jobs', { connection });