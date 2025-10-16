import { Module, MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from '@paypay/redis';
import { createAuthMiddleware } from './auth.middleware';
import { ProxyMiddleware } from './proxy.middleware';
import { RateLimitMiddleware } from './rate-limit.middleware';

@Module({
  imports: [
    RedisModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  providers: [ProxyMiddleware, RateLimitMiddleware],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Rate limiting first (before auth)
    consumer
      .apply(RateLimitMiddleware)
      .forRoutes('*');

    consumer
      .apply(createAuthMiddleware())
      .forRoutes('*');

    consumer
      .apply(ProxyMiddleware)
      .forRoutes('*');
  }
}
