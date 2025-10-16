import * as jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { UnauthorizedException } from "@nestjs/common";
import axios from 'axios';

interface OneToken {
  accessToken?: string;
  refreshToken?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: { userId: string };
}

interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export function createAuthMiddleware() {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const accessToken = req.cookies?.access_token;
    const refreshToken = req.cookies?.refresh_token;

    console.log('AUTH MIDDLEWARE ----- accessToken', accessToken);
    console.log('AUTH MIDDLEWARE ----- refreshToken', refreshToken);
    console.log('AUTH MIDDLEWARE ----- req.method, req.originalUrl', req.method, req.originalUrl)

    if (req.originalUrl === '/api/auth/login/google') {
      console.log('AUTH MIDDLEWARE - PUBLIC ROUTE - SKIPPING', req.body)
      return next();
    }

    if (!accessToken && !refreshToken) {
      throw new UnauthorizedException("Tokens are missing.");
    }

    try {
      if (!accessToken) {
        throw new UnauthorizedException("Invalid access token");
      }

      const userId = await extractIdFromToken({ accessToken });
      console.log('AUTH MIDDLEWARE ----- extractIdFromToken (accessToken) userId:', userId);
      
      if (!userId) {
        throw new UnauthorizedException("Invalid access token");
      }
      
      req.user = { userId: userId };
      return next();
    } catch (error) {
      if (refreshToken) {
        const userId = await extractIdFromToken({ refreshToken });
        console.log('AUTH MIDDLEWARE userId -----> ', userId);
        
        try {
          const response = await axios.post('http://localhost:5003/api/tokens/rotate', { token: refreshToken }, { withCredentials: true });
          saveInCookies(res, response.data as Tokens);
          req.user = { userId: userId || '' };
          return next();
        } catch (rotationError) {
          throw new UnauthorizedException("Token rotation failed.");
        }
      }
      throw new UnauthorizedException("Invalid or expired access token.");
    }
  };
}

function saveInCookies(res: Response, { refreshToken, accessToken }: Tokens) {
  res.cookie("access_token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000 // 15 min
  });

  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 2 * 24 * 60 * 60 * 1000 // 2 days
  });
}

function extractIdFromToken({ refreshToken, accessToken }: OneToken): string | undefined {
  const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET;
  const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET;

  try {
    if (!REFRESH_SECRET && !ACCESS_SECRET) {
      throw new Error('Missing TOKEN SECRETS in environment variables');
    }
  
    let decodedUser;
  
    if (refreshToken) {
        decodedUser = jwt.verify(refreshToken, REFRESH_SECRET as jwt.Secret)
    }
  
    if (accessToken) {
        decodedUser = jwt.verify(accessToken, ACCESS_SECRET as jwt.Secret)
    }

    if (typeof decodedUser === 'object' && decodedUser !== null && 'userId' in decodedUser) {
      return decodedUser.userId as string;
    }
  
    return undefined;
  } catch {
    throw new Error("Invalid token");
  }
}