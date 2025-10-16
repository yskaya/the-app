import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import axios, { Method } from 'axios';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
  };
  rateLimit?: {
    limit: number;
    remaining: number;
    reset: number;
  };
}

@Injectable()
export class ProxyMiddleware implements NestMiddleware {
  private routeMap: Record<string, string> = {
    '/api/auth': 'http://localhost:5001',
    '/api/users': 'http://localhost:5002',
  };

  constructor() {}

  async use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    console.log(`[Proxy] Processing request: ${req.method} ${req.originalUrl}`);
    let backendUrl = '';

    switch (true) {
      case req.originalUrl.startsWith('/api/users/me'):
        backendUrl = 'http://localhost:5002/api/users/me';
        break;
      case req.originalUrl.startsWith('/api/auth/login/google'):
        console.log('req.body', req.body)
        backendUrl = 'http://localhost:5001/api/auth/login/google';
        break;
      case req.originalUrl.startsWith('/api/auth/logout'):
        backendUrl = 'http://localhost:5001/api/auth/logout';
        break;
      default:
        console.error(`No matching backend found for ${req.originalUrl}`);
        return res.status(404).json({ message: 'Not Found' });
    }

    try {
      console.log(`PROXY ------> Forwarding: ${req.method} ${req.originalUrl} -> ${backendUrl}`);

      const response = await axios({
        method: req.method as Method,
        url: backendUrl,
        data: req.body,
        headers: {
          ...req.headers as Record<string, string>,
          'x-user-id': req.user?.userId || '',
        },
        withCredentials: true,
        validateStatus: (status) => status < 400, // Accept 304 as valid response
      });

      console.log(`[Proxy] Response received, status: ${response.status}`);

      // Forward set-cookie headers
      const setCookieHeaders = response.headers['set-cookie'];
      if (setCookieHeaders && setCookieHeaders.length > 0) {
        setCookieHeaders.forEach((cookie) => res.append('Set-Cookie', cookie));
      }

      // Forward rate limit headers from the original request
      console.log(`[Proxy] Rate limit data:`, req.rateLimit);
      console.log(`[Proxy] Request object keys:`, Object.keys(req));
      console.log(`[Proxy] Request rateLimit property:`, req.rateLimit);
      
      if (req.rateLimit) {
        console.log(`[Proxy] Setting rate limit headers:`, {
          limit: req.rateLimit.limit,
          remaining: req.rateLimit.remaining,
          reset: req.rateLimit.reset
        });
        res.set({
          'X-RateLimit-Limit': req.rateLimit.limit.toString(),
          'X-RateLimit-Remaining': req.rateLimit.remaining.toString(),
          'X-RateLimit-Reset': req.rateLimit.reset.toString(),
        });
      } else {
        console.log(`[Proxy] No rate limit data found on request`);
      }

      console.log(`[Proxy] Sending response to client`);
      
      // Handle 304 Not Modified responses
      if (response.status === 304) {
        return res.status(304).end();
      }
      
      return res.status(response.status).send(response.data);
    } catch (error: any) {
      console.log(`[Proxy] Error occurred:`, error.message);
      return res.status(error.response?.status || 500).json({ message: 'Proxy Error' });
    }
  }
}