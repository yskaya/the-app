import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { GrpcUsersService } from './grpc-users.service';
import { GRPC_USERS_CLIENT_REGISTER } from './grpc-users.config';

@Module({
  imports: [
    ClientsModule.register([
      GRPC_USERS_CLIENT_REGISTER
    ]),
  ],
  providers: [GrpcUsersService],
  exports: [GrpcUsersService, ClientsModule],
})
export class GrpcUsersModule {}