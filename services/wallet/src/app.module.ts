import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from '@paypay/redis';
import { WalletModule } from './wallet/wallet.module';

@Module({
  imports: [
    WalletModule,
    PrismaModule,
    RedisModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
})
export class AppModule {}

