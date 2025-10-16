import { Injectable, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
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
    try {
      const cacheKey = `user:${id}`;
      const cachedUser = await this.redisService.get(cacheKey);
      
      if (cachedUser) return JSON.parse(cachedUser);
      
      const user = await this.prisma.user.findUnique({ where: { id } });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user) await this.redisService.set(cacheKey, JSON.stringify(user), 3600);
      
      return { user };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to retrieve user profile');
    }
  }

  async verifyEmail(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    
    return { user: user || null };
  }

  async createUser(userProfile: any) {
    try {
      const user = await this.prisma.user.create({ data: userProfile });
      return { user };
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('Email already exists');
      }
      throw new InternalServerErrorException('Failed to create user');
    }
  }
}