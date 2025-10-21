import cookieParser from 'cookie-parser';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
const rateLimit = require('express-rate-limit');

const DEFAULT_PORT = 5005;
const DEFAULT_FRONTEND = 'http://localhost:3000';

async function bootstrap() {
  const REST_PORT = process.env.HTTP_CONTACTS_PORT || DEFAULT_PORT;
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api'); 

  // Rate limiting for contacts endpoints
  const contactsLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300, // 300 requests per window
    message: {
      error: 'Too Many Requests',
      message: 'Rate limit exceeded, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
  
  app.use('/api/contacts', contactsLimiter);

  app.enableCors({
    origin: [process.env.FRONTEND_URL || DEFAULT_FRONTEND],
    credentials: true,
  });
  
  app.use(cookieParser());
  
  await app.listen(REST_PORT);

  console.log(`🚀 Contacts Service REST API running on http://localhost:${REST_PORT}`);
}

bootstrap();

