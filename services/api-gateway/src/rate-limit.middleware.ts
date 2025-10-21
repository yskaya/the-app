import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RedisService } from '@paypay/redis';

export interface RateLimitRequest extends Request {
  rateLimit?: {
    limit: number;
    remaining: number;
    reset: number;
  };
}

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  constructor(private readonly redisService: RedisService) {}

  async use(req: RateLimitRequest, res: Response, next: NextFunction) {
    const clientId = this.getClientId(req);
    const endpoint = req.originalUrl;
    
    // 🔧 Skip rate limiting in development for auth endpoints
    const isDevelopment = process.env.NODE_ENV !== 'production';
    if (isDevelopment && endpoint.startsWith('/api/auth/')) {
      console.log(`[Rate Limit] SKIPPED (development mode): ${req.method} ${endpoint}`);
      return next();
    }
    
    console.log(`[Rate Limit] Processing request: ${req.method} ${endpoint} from ${clientId}`);
    
    // Different rate limits for different endpoints
    const limits = this.getRateLimits(endpoint);
    
    console.log(`[Rate Limit] Limits for ${endpoint}: ${limits.requests} requests per ${limits.windowMs}ms`);
    
    try {
      const result = await this.checkRateLimit(clientId, endpoint, limits);
      
      if (result.allowed) {
        // Set rate limit headers
        res.set({
          'X-RateLimit-Limit': limits.requests.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.resetTime.toString(),
        });
        
        console.log(`[Rate Limit] Allowed: true, Remaining: ${result.remaining}/${limits.requests}`);
        
        req.rateLimit = {
          limit: limits.requests,
          remaining: result.remaining,
          reset: result.resetTime,
        };
        
        next();
      } else {
        res.status(429).json({
          error: 'Too Many Requests',
          message: `Rate limit exceeded. Try again in ${result.retryAfter} seconds.`,
          retryAfter: result.retryAfter,
        });
      }
    } catch (error) {
      console.error('Rate limiting error:', error);
      // Allow request to proceed if rate limiting fails
      next();
    }
  }

  private getClientId(req: Request): string {
    // Use IP address as primary identifier
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    
    // For authenticated users, also include user ID for more granular limiting
    const userId = (req as any).user?.userId;
    return userId ? `${userId}:${ip}` : ip;
  }

  private getRateLimits(endpoint: string): { requests: number; windowMs: number } {
    // Stricter limits for auth endpoints
    if (endpoint.startsWith('/api/auth/login')) {
      // 🔧 Development: Much higher limit for testing (default to dev mode if not set)
      const isDevelopment = process.env.NODE_ENV !== 'production';
      return isDevelopment 
        ? { requests: 1000, windowMs: 60 * 1000 } // DEV: 1000 attempts per minute (basically unlimited)
        : { requests: 5, windowMs: 15 * 60 * 1000 }; // PROD: 5 attempts per 15 minutes
    }
    
    if (endpoint.startsWith('/api/auth/logout')) {
      return { requests: 10, windowMs: 5 * 60 * 1000 }; // 10 attempts per 5 minutes
    }
    
    if (endpoint.startsWith('/api/auth/')) {
      return { requests: 20, windowMs: 15 * 60 * 1000 }; // 20 attempts per 15 minutes
    }
    
    // General API limits
    if (endpoint.startsWith('/api/')) {
      return { requests: 100, windowMs: 15 * 60 * 1000 }; // 100 requests per 15 minutes
    }
    
    // Default limit
    return { requests: 200, windowMs: 15 * 60 * 1000 }; // 200 requests per 15 minutes
  }

  private async checkRateLimit(
    clientId: string,
    endpoint: string,
    limits: { requests: number; windowMs: number }
  ): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
  }> {
    const key = `rate_limit:${clientId}:${endpoint}`;
    const window = Math.floor(Date.now() / limits.windowMs);
    const windowKey = `${key}:${window}`;
    
    // Increment counter first
    const pipeline = this.redisService.pipeline();
    pipeline.incr(windowKey);
    pipeline.expire(windowKey, Math.ceil(limits.windowMs / 1000));
    const results = await pipeline.exec();
    
    // Get the new count after increment
    const newCount = results?.[0]?.[1] as number || 1;
    
    if (newCount > limits.requests) {
      // Rate limit exceeded
      const nextWindow = window + 1;
      const resetTime = nextWindow * limits.windowMs;
      const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
      
      return {
        allowed: false,
        remaining: 0,
        resetTime,
        retryAfter,
      };
    }
    
    return {
      allowed: true,
      remaining: limits.requests - newCount,
      resetTime: (window + 1) * limits.windowMs,
    };
  }
}
