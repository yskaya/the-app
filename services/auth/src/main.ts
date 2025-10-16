import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const DEFAULT_PORT = 5001;
const DEFAULT_FRONTEND = 'http://localhost:3000';

async function bootstrap() {
  const PORT = process.env.HTTP_AUTH_PORT || DEFAULT_PORT;
  const app = await NestFactory.create(AppModule);
  
  app.setGlobalPrefix('api'); 
  
  app.use(cookieParser());
  
  // Rate limiting for auth endpoints
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 login attempts per window
    message: {
      error: 'Too Many Requests',
      message: 'Too many login attempts, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
  
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: {
      error: 'Too Many Requests',
      message: 'Rate limit exceeded, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
  
  // Apply stricter rate limiting to login endpoint
  app.use('/api/auth/login', authLimiter);
  
  // Apply general rate limiting to other endpoints
  app.use('/api/auth', generalLimiter);
  
  app.enableCors({
    origin: [process.env.FRONTEND_URL || DEFAULT_FRONTEND],
    credentials: true,
  });

  await app.listen(PORT);
  console.log(`auth service running on ${PORT}`);
}

bootstrap();
