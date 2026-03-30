import { nanoid } from 'nanoid';
import { Request, Response, NextFunction } from 'express';

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  // Check if X-Request-ID header exists and is valid
  let requestId = req.headers['x-request-id'] as string;
  
  if (requestId) {
    // Validate requestId: alphanumeric + hyphens, max 64 chars
    if (!/^[a-zA-Z0-9-]{1,64}$/.test(requestId)) {
      requestId = `req_${nanoid(12)}`;
    }
  } else {
    // Generate new requestId if none provided
    requestId = `req_${nanoid(12)}`;
  }
  
  // Store requestId in res.locals for use in other middleware and handlers
  res.locals.requestId = requestId;
  
  // Add requestId to response headers
  res.set('X-Request-ID', requestId);
  
  // Add other required response headers
  res.set('X-OracleIQ-Version', '2.0.0');
  res.set('X-API-Deprecated', 'false');
  
  // Record start time for response time measurement
  const startTime = Date.now();
  
  // Calculate and add response time header when response is finished
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    res.set('X-Response-Time', `${responseTime}ms`);
  });
  
  next();
}