import crypto from 'crypto';

/**
 * Hash API key for storage
 */
export function hashApiKey(apiKey: string): string {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

/**
 * Generate cache key for API requests
 */
export function generateCacheKey(params: any): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${JSON.stringify(params[key])}`)
    .join('&');
  return crypto.createHash('sha256').update(sortedParams).digest('hex');
}

/**
 * Generate unique identifier for analysis requests
 */
export function generateAnalysisHash(
  marketId: string, 
  analysisDepth: string, 
  perspective: string, 
  audience: string
): string {
  const data = `${marketId}:${analysisDepth}:${perspective}:${audience}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Verify API key format
 */
export function isValidApiKeyFormat(apiKey: string): boolean {
  const apiKeyPattern = /^[a-zA-Z0-9_-]{30,100}$/;
  return apiKeyPattern.test(apiKey);
}