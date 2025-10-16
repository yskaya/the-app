import cookieParser from 'cookie-parser';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';

const DEFAULT_PORT = 5002;
const DEFAULT_FRONTEND = 'http://localhost:3000';

async function bootstrap() {
  const REST_PORT = process.env.HTTP_USERS_PORT || DEFAULT_PORT;
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api'); 

  app.enableCors({
    origin: [process.env.FRONTEND_URL || DEFAULT_FRONTEND],
    credentials: true,
  });
  
  await app.listen(REST_PORT);

  console.log(`REST API running on http://localhost:${REST_PORT}`);

  // gRPC disabled for simplicity in local dev
}

bootstrap();
