import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { GRPC_TOKENS_URL, GRPC_TOKENS_CONFIG } from '@paypay/grpc-clients';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, GRPC_TOKENS_CONFIG as MicroserviceOptions);

  await app.listen();
  console.log(`tokens service running on ${GRPC_TOKENS_URL}`); // GRPC PORT: 50053
}

bootstrap();