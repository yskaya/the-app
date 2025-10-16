import { Module, MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GrpcTokensModule, GrpcUsersModule } from '@paypay/grpc-clients';
import { RedisModule } from '@paypay/redis';
import { AuthMiddleware } from './auth.middleware';
import { ProxyMiddleware } from './proxy.middleware';

@Module({
  imports: [
    GrpcTokensModule,
    GrpcUsersModule,
    RedisModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes('*');

    consumer
      .apply(ProxyMiddleware)
      .forRoutes('*');
  }
}
