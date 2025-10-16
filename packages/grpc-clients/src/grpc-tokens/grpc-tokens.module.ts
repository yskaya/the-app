import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { GrpcTokensService } from './grpc-tokens.service';
import { GRPC_TOKENS_CLIENT_REGISTER } from './grpc-tokens.config';

@Module({
  imports: [
    ClientsModule.register([
      GRPC_TOKENS_CLIENT_REGISTER
    ]),
  ],
  providers: [GrpcTokensService],
  exports: [GrpcTokensService, ClientsModule],
})
export class GrpcTokensModule {}
