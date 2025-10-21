import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Middleware
  app.use(cookieParser());

  // CORS
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // Port
  const port = configService.get<number>('HTTP_WALLET_PORT') || 5006;
  
  await app.listen(port);
  console.log(`🚀 Wallet Service running on http://localhost:${port}`);
}

bootstrap();

