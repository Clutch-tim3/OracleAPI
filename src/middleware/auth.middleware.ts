import { Request, Response, NextFunction } from 'express';
import { hashApiKey, isValidApiKeyFormat } from '../utils/hashUtils';

const validApiKeys = new Set([
  'demo-api-key-12345',
  'test-key-abc123'
]);

export const validateApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-rapidapi-key'] as string;
  
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'API_KEY_MISSING',
        message: 'X-RapidAPI-Key header is required'
      }
    });
  }

  if (!isValidApiKeyFormat(apiKey)) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'API_KEY_INVALID',
        message: 'API key format is invalid'
      }
    });
  }

  // Check if API key is valid
  if (!validApiKeys.has(apiKey)) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'API_KEY_INVALID',
        message: 'API key is invalid'
      }
    });
  }

  // Attach API key hash to request for logging and rate limiting
  (req as any).apiKeyHash = hashApiKey(apiKey);
  (req as any).apiKeyTier = determineTier(apiKey);
  
  next();
};

function determineTier(apiKey: string): string {
  if (apiKey.startsWith('demo')) {
    return 'FREE';
  } else if (apiKey.startsWith('test')) {
    return 'BASIC';
  } else if (apiKey.startsWith('pro')) {
    return 'PRO';
  } else if (apiKey.startsWith('enterprise')) {
    return 'ENTERPRISE';
  }
  return 'FREE';
}

export const requireTier = (requiredTier: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userTier = (req as any).apiKeyTier;
    
    const tierHierarchy: Record<string, number> = {
      'FREE': 0,
      'BASIC': 1,
      'PRO': 2,
      'ENTERPRISE': 3
    };

    if (tierHierarchy[userTier] < tierHierarchy[requiredTier]) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'TIER_LIMIT_EXCEEDED',
          message: `This endpoint requires ${requiredTier} tier access`,
          details: {
            current_tier: userTier,
            required_tier: requiredTier
          }
        }
      });
    }

    next();
  };
};