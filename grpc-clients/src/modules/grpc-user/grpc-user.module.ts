import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { GrpcUserService } from './grpc-user.service';
import { GRPC_USER_REGISTER, GRPC_USER_NAME} from './grpc-user.config';

@Module({
  imports: [
    ClientsModule.register([
      GRPC_USER_REGISTER
    ]),
  ],
  providers: [GrpcUserService],
  exports: [GrpcUserService, ClientsModule],
})
export class GrpcUserModule {}