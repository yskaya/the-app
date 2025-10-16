import { Transport, MicroserviceOptions, ClientProviderOptions } from '@nestjs/microservices';
import { join } from 'path';

export const GRPC_USERS_CLIENT_NAME = 'USERS_SERVICE';
export const GRPC_USERS_SERVICE_NAME = 'GrpcUsersService';
export const GRPC_USERS_PACKAGE_NAME = 'users';
export const GRPC_USERS_PROTO_FILE = join(__dirname, '../', 'proto', 'users.proto');
export const GRPC_USERS_URL = '0.0.0.0:50052';
export const GRPC_USERS_URL_DOCKER = 'users:50052';

export const GRPC_USERS_CONFIG: MicroserviceOptions = {
  transport: Transport.GRPC,
  options: {
    package: GRPC_USERS_PACKAGE_NAME,
    protoPath: GRPC_USERS_PROTO_FILE,
    url: GRPC_USERS_URL,
  },
};

export const GRPC_USERS_CLIENT_REGISTER: ClientProviderOptions = {
  name: GRPC_USERS_CLIENT_NAME,
  transport: Transport.GRPC,
  options: {
    package: GRPC_USERS_PACKAGE_NAME,
    protoPath: GRPC_USERS_PROTO_FILE,
    url: GRPC_USERS_URL,
  },
};
