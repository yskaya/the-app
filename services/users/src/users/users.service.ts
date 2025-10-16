import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@paypay/prisma';
import { RedisService } from '@paypay/redis';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async getProfile(id: string) {
    const cacheKey = `user:${id}`;
    const cachedUser = await this.redisService.get(cacheKey);
    
    if (cachedUser) return JSON.parse(cachedUser);
    
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new Error('User not found');
    }

    if (user) await this.redisService.set(cacheKey, JSON.stringify(user), 3600);
    
    return { user };
  }

  async verifyEmail(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    
    return { user: user || null };
  }

  async createUser(userProfile: any) {
    const user = await this.prisma.user.create({ data: userProfile });
    
    return { user: user || null };
  }
}