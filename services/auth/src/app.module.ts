import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GrpcTokensModule, GrpcUsersModule } from '@paypay/grpc-clients';
import { AuthModule } from './auth.module';

@Module({
  imports: [
    AuthModule,
    GrpcTokensModule,
    GrpcUsersModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
})
export class AppModule {}