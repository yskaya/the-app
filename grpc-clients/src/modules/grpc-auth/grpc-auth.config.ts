import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { join } from 'path';

export const GRPC_AUTH_NAME = 'AUTH_SERVICE';
export const GRPC_AUTH_PACKAGE_NAME = 'pp_auth';
export const GRPC_AUTH_PROTO_FILE = join(__dirname, '../../', 'proto', 'pp-auth.proto');
export const GRPC_AUTH_URL = 'localhost:50051';

export const GRPC_AUTH_CONFIG: MicroserviceOptions = {
  transport: Transport.GRPC,
  options: {
    package: GRPC_AUTH_PACKAGE_NAME,
    protoPath: GRPC_AUTH_PROTO_FILE,
    url: GRPC_AUTH_URL,
  },
};

export const GRPC_AUTH_REGISTER = {
  name: GRPC_AUTH_NAME,
  ...GRPC_AUTH_CONFIG,
};
