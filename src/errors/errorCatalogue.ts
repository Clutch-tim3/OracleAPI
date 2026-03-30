import { Request } from 'express';

export interface ErrorDetails {
  code: string;
  message: string;
  detail: string;
  docs_url: string;
  request_id?: string;
  timestamp?: string;
  quota?: { used: number; limit: number; resets_at: string };
  required_tier?: string;
  current_tier?: string;
  upgrade_url?: string;
  valid_categories?: string[];
  field?: string;
  location?: string;
  retry_after_seconds?: number;
}

export interface ApiErrorResponse {
  success: false;
  error: ErrorDetails;
}

export class ApiError extends Error {
  constructor(
    public readonly details: ErrorDetails
  ) {
    super(details.message);
    this.name = details.code;
  }
}

const baseDocsUrl = 'https://oracleiq.dev/docs/errors';

export function getErrorDetails(code: string, req?: any, options?: any): ErrorDetails {
  const details: ErrorDetails = {
    code,
    message: '',
    detail: '',
    docs_url: `${baseDocsUrl}#${code}`,
    request_id: req?.['locals']?.['requestId'],
    timestamp: new Date().toISOString(),
  };

  switch (code) {
    // Authentication errors (401)
    case 'MISSING_API_KEY':
      details.message = 'Missing API key';
      details.detail = 'No X-RapidAPI-Key header was provided in the request.';
      break;
    case 'INVALID_API_KEY':
      details.message = 'Invalid API key';
      details.detail = 'The provided API key is not recognized or has been revoked.';
      break;

    // Rate limiting errors (429)
    case 'RATE_LIMIT_EXCEEDED':
      details.message = 'Rate limit exceeded';
      details.detail = 'You have exceeded the per-second rate limit for your API key. Please try again later.';
      if (options.quota) {
        details.quota = options.quota;
      }
      break;
    case 'QUOTA_EXCEEDED':
      details.message = 'Quota exceeded';
      details.detail = 'You have exhausted your monthly API quota. Upgrade your plan to continue using the API.';
      if (options.quota) {
        details.quota = options.quota;
      }
      break;

    // Tier/permission errors (403)
    case 'TIER_INSUFFICIENT':
      details.message = 'Insufficient tier';
      details.detail = 'This feature requires a higher API tier. Please upgrade your plan to access this endpoint.';
      if (options.requiredTier) details.required_tier = options.requiredTier;
      if (options.currentTier) details.current_tier = options.currentTier;
      details.upgrade_url = 'https://rapidapi.com/oracleiq/upgrade';
      break;
    case 'WEBSOCKET_TIER_REQUIRED':
      details.message = 'WebSocket requires PRO+ tier';
      details.detail = 'The WebSocket endpoint is only available to PRO and higher API tiers.';
      details.required_tier = 'PRO';
      if (options.currentTier) details.current_tier = options.currentTier;
      details.upgrade_url = 'https://rapidapi.com/oracleiq/upgrade';
      break;

    // Input validation errors (422)
    case 'INVALID_CATEGORY':
      details.message = 'Invalid category';
      details.detail = 'The requested category is not in the list of valid categories.';
      details.valid_categories = ['crypto', 'us-elections', 'economics', 'tech-policy', 'sports', 'entertainment'];
      break;
    case 'INVALID_MARKET_ID':
      details.message = 'Invalid market ID';
      details.detail = 'The market ID format is invalid. Market IDs must start with "market_".';
      break;
    case 'INVALID_DATE_RANGE':
      details.message = 'Invalid date range';
      details.detail = 'The date_from parameter must be before the date_to parameter.';
      break;
    case 'MISSING_REQUIRED_FIELD':
      details.message = 'Missing required field';
      details.detail = 'A required field is missing from the request.';
      if (options.field) details.field = options.field;
      if (options.location) details.location = options.location;
      break;
    case 'INVALID_PROBABILITY':
      details.message = 'Invalid probability';
      details.detail = 'Probability must be between 0.0 and 1.0 inclusive.';
      break;
    case 'TOO_MANY_POSITIONS':
      details.message = 'Too many positions';
      details.detail = 'You can simulate at most 50 positions in a single request.';
      break;

    // Resource errors (404)
    case 'MARKET_NOT_FOUND':
      details.message = `Market '${options.marketId || 'unknown'}' not found`;
      details.detail = 'The market ID provided does not exist or has been archived.';
      break;
    case 'EVENT_NOT_FOUND':
      details.message = `Event '${options.eventId || 'unknown'}' not found`;
      details.detail = 'The event ID provided does not exist or has been archived.';
      break;
    case 'ALERT_NOT_FOUND':
      details.message = 'Alert not found';
      details.detail = 'The alert ID provided does not exist or belongs to a different API key.';
      break;

    // Business logic errors (409)
    case 'MARKET_RESOLVED':
      details.message = 'Market already resolved';
      details.detail = 'Analysis is not available for resolved markets.';
      break;
    case 'ALERT_ALREADY_EXISTS':
      details.message = 'Alert already exists';
      details.detail = 'An alert with the same parameters already exists for this market.';
      break;
    case 'MARKET_INSUFFICIENT_VOLUME':
      details.message = 'Insufficient market volume';
      details.detail = 'The market does not have enough volume to perform analysis.';
      break;

    // AI/processing errors (503)
    case 'AI_ANALYSIS_UNAVAILABLE':
      details.message = 'AI analysis unavailable';
      details.detail = 'The AI analysis service is currently unavailable. Please try again later.';
      details.retry_after_seconds = options.retryAfter || 30;
      break;
    case 'CONSENSUS_INSUFFICIENT_DATA':
      details.message = 'Insufficient data for consensus';
      details.detail = 'There are fewer markets matching your criteria than the minimum required for consensus calculation.';
      break;

    // Server errors (500)
    case 'INTERNAL_ERROR':
    default:
      details.code = 'INTERNAL_ERROR';
      details.message = 'Internal server error';
      details.detail = 'An unexpected error occurred. Our team has been notified. Please try again later.';
      break;
  }

  return details;
}

export function createApiError(code: string, req?: Request, options?: any): ApiError {
  return new ApiError(getErrorDetails(code, req, options));
}

export function formatErrorResponse(error: any, req?: Request): ApiErrorResponse {
  if (error instanceof ApiError) {
    return {
      success: false,
      error: error.details,
    };
  }

  return {
    success: false,
    error: getErrorDetails('INTERNAL_ERROR', req),
  };
}