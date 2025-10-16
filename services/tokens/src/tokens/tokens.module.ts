import { Module } from '@nestjs/common';
import { RedisModule } from '@paypay/redis';
import { TokensService } from './tokens.service';
import { TokensController } from './tokens.controller';

@Module({
  imports: [RedisModule],
  providers: [TokensService],
  controllers: [TokensController],
})
export class TokensModule {}