import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GrpcTokensModule, GrpcUsersModule } from '@paypay/grpc-clients';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

@Module({
  imports: [ConfigModule, GrpcTokensModule, GrpcUsersModule],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
