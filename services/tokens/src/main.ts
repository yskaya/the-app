import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
const rateLimit = require('express-rate-limit');

const DEFAULT_PORT = 5003;

async function bootstrap() {
  const PORT = process.env.HTTP_TOKENS_PORT || DEFAULT_PORT;
  const app = await NestFactory.create(AppModule);
  
  app.setGlobalPrefix('api');
  
  // Rate limiting for tokens endpoints
  const tokensLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300, // 300 requests per window (tokens are used frequently)
    message: {
      error: 'Too Many Requests',
      message: 'Rate limit exceeded, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
  
  app.use('/api/tokens', tokensLimiter);
  
  await app.listen(PORT);
  console.log(`tokens service running on http://localhost:${PORT}`);
}

bootstrap();