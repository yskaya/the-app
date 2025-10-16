import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

const DEFAULT_PORT = 5003;

async function bootstrap() {
  const PORT = process.env.HTTP_TOKENS_PORT || DEFAULT_PORT;
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  await app.listen(PORT);
  console.log(`tokens service running on http://localhost:${PORT}`);
}

bootstrap();