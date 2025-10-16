import { Request, Response, NextFunction } from 'express';
import * as cookieParser from 'cookie-parser';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

const DEFAULT_GATEWAY_PORT = 5555;
const DEFAULT_FRONTEND = 'http://localhost:3000';

async function bootstrap() {
  const PORT = process.env.API_GATEWAY_PORT || DEFAULT_GATEWAY_PORT;
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.use(cookieParser());
  app.enableCors({
    origin: [process.env.FRONTEND_URL || DEFAULT_FRONTEND],
    credentials: true, 
  });

  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`[API Gateway] Incoming Request: ${req.method} ${req.url}`);
    next();
  });

  
  await app.listen(PORT);
}

bootstrap();