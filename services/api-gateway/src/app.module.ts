import { Module, MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from '@paypay/redis';
import { createAuthMiddleware } from './auth.middleware';
import { ProxyMiddleware } from './proxy.middleware';

@Module({
  imports: [
    RedisModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  providers: [ProxyMiddleware],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(createAuthMiddleware())
      .forRoutes('*');

    consumer
      .apply(ProxyMiddleware)
      .forRoutes('*');
  }
}
