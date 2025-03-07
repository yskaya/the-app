import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { join } from 'path';

export const GRPC_USER_NAME = 'USER_SERVICE';
export const GRPC_USER_PACKAGE_NAME = 'pp_user';
export const GRPC_USER_PROTO_FILE = join(__dirname, '../../', 'proto', 'pp-user.proto');
export const GRPC_USER_URL = 'localhost:50052';

export const GRPC_USER_CONFIG: MicroserviceOptions = {
  transport: Transport.GRPC,
  options: {
    package: GRPC_USER_PACKAGE_NAME,
    protoPath: GRPC_USER_PROTO_FILE,
    url: GRPC_USER_URL,
  },
};

export const GRPC_USER_REGISTER = {
  name: GRPC_USER_NAME,
  ...GRPC_USER_CONFIG,
};
