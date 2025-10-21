import { Module } from '@nestjs/common';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '@paypay/redis';

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [WalletController],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule {}

