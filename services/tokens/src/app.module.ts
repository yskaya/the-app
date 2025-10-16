import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from '@paypay/redis';
import { TokensModule } from './tokens/tokens.module';

@Module({
  imports: [
    TokensModule,
    RedisModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
})
export class AppModule {}