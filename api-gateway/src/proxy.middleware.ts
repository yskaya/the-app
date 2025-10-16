import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import axios, { Method } from 'axios';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
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
    let backendUrl = '';

    switch (true) {
      case req.originalUrl.startsWith('/api/users/me'):
        backendUrl = 'http://localhost:5002/api/users/me';
        break;
      case req.originalUrl.startsWith('/api/auth/login/google'):
        console.log('req.body', req.body)
        backendUrl = 'http://localhost:5001/api/auth/login/google';
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
      });

      const setCookieHeaders = response.headers['set-cookie'];
      if (setCookieHeaders && setCookieHeaders.length > 0) {
        setCookieHeaders.forEach((cookie) => res.append('Set-Cookie', cookie));
      }

      return res.status(response.status).send(response.data);
    } catch (error: any) {
      return res.status(error.response?.status || 500).json({ message: 'Proxy Error' });
    }
  }
}