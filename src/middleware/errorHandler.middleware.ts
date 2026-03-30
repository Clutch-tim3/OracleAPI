import { Request, Response, NextFunction } from 'express';
import { formatErrorResponse, ApiError, ApiErrorResponse } from '../errors/errorCatalogue';

export function errorHandlerMiddleware(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log the error
  console.error('API Error:', {
    requestId: res.locals.requestId,
    method: req.method,
    path: req.path,
    error: error instanceof ApiError ? error.details : error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
  });

  // Format the error response
  const errorResponse: ApiErrorResponse = formatErrorResponse(error, req);

  // Determine status code based on error code
  let statusCode = 500;
  if (error instanceof ApiError) {
    const { code } = error.details;
    if (code.startsWith('MISSING_') || code.startsWith('INVALID_API_KEY')) {
      statusCode = 401;
    } else if (code.startsWith('RATE_') || code.startsWith('QUOTA_')) {
      statusCode = 429;
    } else if (code.startsWith('TIER_') || code.startsWith('WEBSOCKET_')) {
      statusCode = 403;
    } else if (code.startsWith('INVALID_') || code.startsWith('MISSING_REQUIRED_') || code.startsWith('TOO_MANY_')) {
      statusCode = 422;
    } else if (code.startsWith('MARKET_NOT_FOUND') || code.startsWith('EVENT_NOT_FOUND') || code.startsWith('ALERT_NOT_FOUND')) {
      statusCode = 404;
    } else if (code.startsWith('MARKET_RESOLVED') || code.startsWith('ALERT_ALREADY_EXISTS') || code.startsWith('MARKET_INSUFFICIENT_')) {
      statusCode = 409;
    } else if (code.startsWith('AI_') || code.startsWith('CONSENSUS_')) {
      statusCode = 503;
    }
  }

  // Send the response
  res.status(statusCode).json(errorResponse);
}