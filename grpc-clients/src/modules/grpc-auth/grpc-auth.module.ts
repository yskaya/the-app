import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { GrpcAuthService } from './grpc-auth.service';
import { GRPC_AUTH_REGISTER } from './grpc-auth.config';

@Module({
  imports: [
    ClientsModule.register([
      GRPC_AUTH_REGISTER
    ]),
  ],
  providers: [GrpcAuthService],
  exports: [GrpcAuthService, ClientsModule],
})
export class GrpcAuthModule {}
