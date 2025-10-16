import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '@paypay/redis';
import * as Helpers from './tokens.helper';

interface Tokens {
  accessToken: string;
  refreshToken: string;
}

interface TokenValidationResponse {
  valid: boolean;
  userId?: string;
}

@Injectable()
export class TokensService {
  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  async validateAccessToken(accessToken: string): Promise<TokenValidationResponse> {
    if (!accessToken) {
      throw new Error('No token token provided');
    }

    try {
      const userId = Helpers.extractIdFromToken({ accessToken });
      
      if (!userId) {
        throw new UnauthorizedException("Invalid or expired access token.");
      }

      return { valid: true, userId };
    } catch {
      return { valid: false };
    }
  }

  async rotateTokens(oldRefreshToken: string): Promise<Tokens> {
    if (!oldRefreshToken) {
      throw new Error('No refresh token provided');
    }

    const userId = Helpers.extractIdFromToken({ refreshToken: oldRefreshToken });
    
    if (!userId) {
      throw new Error('Invalid refresh token');
    }

    const cachedAccessToken = await this.redisService.get(`cached_access_token:${userId}`);
    if (cachedAccessToken) {
      return { accessToken: cachedAccessToken, refreshToken: oldRefreshToken }
    }

    const storedRefreshToken = await this.redisService.get(`refresh_token:${userId}`);
    if (!storedRefreshToken || storedRefreshToken !== oldRefreshToken) {
      throw new Error('Invalid refresh token');
    }

    const newTokens = await this.generateTokens(userId);

    return { accessToken: newTokens.accessToken, refreshToken: newTokens.refreshToken };
  }

  async generateTokens(userId: string) {
    const exp = this.configService.get('REFRESH_TOKEN_EXP')
    const newAccessToken = Helpers.generateAccessToken(userId);
    const newRefreshToken = Helpers.generateRefreshToken(userId);

    console.log('!!!! EXP !!!!!', exp);

    await this.redisService.set(`cached_access_token:${userId}`, newAccessToken, 50);
    await this.redisService.set(`refresh_token:${userId}`, newRefreshToken, 604800); // 7 days expiration

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  async invalidateToken(token: string): Promise<{ success: boolean }> {
    try {
      const userId = Helpers.extractIdFromToken({ refreshToken: token });
      
      if (!userId) {
        return { success: false };
      }

      // Remove all tokens for this user from Redis
      await this.redisService.del(`refresh_token:${userId}`);
      await this.redisService.del(`cached_access_token:${userId}`);
      
      return { success: true };
    } catch (error) {
      console.error('Token invalidation failed:', error);
      return { success: false };
    }
  }
}