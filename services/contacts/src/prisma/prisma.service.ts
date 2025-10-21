import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../../node_modules/.prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

