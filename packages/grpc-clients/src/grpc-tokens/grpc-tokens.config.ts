import { Transport, MicroserviceOptions, ClientProviderOptions } from '@nestjs/microservices';
import { join } from 'path';

export const GRPC_TOKENS_CLIENT_NAME = 'TOKENS_SERVICE';
export const GRPC_TOKENS_SERVICE_NAME = 'GrpcTokensService';
export const GRPC_TOKENS_PACKAGE_NAME = 'tokens';
export const GRPC_TOKENS_PROTO_FILE = join(__dirname, '../', 'proto', 'tokens.proto');
export const GRPC_TOKENS_URL = '0.0.0.0:50053';
export const GRPC_TOKENS_URL_DOCKER = 'tokens:50053';

export const GRPC_TOKENS_CONFIG: MicroserviceOptions = {
  transport: Transport.GRPC,
  options: {
    package: GRPC_TOKENS_PACKAGE_NAME,
    protoPath: GRPC_TOKENS_PROTO_FILE,
    url: GRPC_TOKENS_URL,
  },
};

export const GRPC_TOKENS_CLIENT_REGISTER: ClientProviderOptions = {
  name: GRPC_TOKENS_CLIENT_NAME,
  transport: Transport.GRPC,
  options: {
    package: GRPC_TOKENS_PACKAGE_NAME,
    protoPath: GRPC_TOKENS_PROTO_FILE,
    url: GRPC_TOKENS_URL,
  },
};
