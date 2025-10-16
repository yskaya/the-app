import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { ConfigService } from '@nestjs/config';
import { Injectable, NestMiddleware, UnauthorizedException } from "@nestjs/common";
import { GrpcTokensService, Tokens } from '@paypay/grpc-clients';

interface OneToken {
  accessToken?: string;
  refreshToken?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: { userId: string };
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    private readonly grpcTokensService: GrpcTokensService,
    private readonly configService: ConfigService,
  ) {}

  async use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
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

      const userId = await this.extractIdFromToken({ accessToken });
      console.log('AUTH MIDDLEWARE ----- extractIdFromToken (accessToken) userId:', userId);
      
      if (!userId) {
        throw new UnauthorizedException("Invalid access token");
      }
      
      req.user = { userId: userId };
      return next();
    } catch (error) {
      if (refreshToken) { // error instanceof Error && error.name === "TokenExpiredError" && refreshToken
        const userId = await this.extractIdFromToken({ refreshToken });
        console.log('AUTH MIDDLEWARE userId -----> ', userId);
        
        //const refreshToken = await this.redisService.get(`refresh_token:${userId}`);
        try {
          const newTokens = await this.grpcTokensService.rotateTokens({ token: refreshToken });
          this.saveInCookies(res, newTokens);
          req.user = { userId: userId || '' };
          return next();
        } catch (rotationError) {
          throw new UnauthorizedException("Token rotation failed.");
        }
      }
      throw new UnauthorizedException("Invalid or expired access token.");
    }
    next();
  }

  saveInCookies(res: Response, { refreshToken, accessToken }: Tokens) {
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

  private extractIdFromToken({ refreshToken, accessToken }: OneToken): string | undefined {
    const REFRESH_SECRET = this.configService.get<string>('REFRESH_TOKEN_SECRET')
    const ACCESS_SECRET = this.configService.get<string>('ACCESS_TOKEN_SECRET')

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
}