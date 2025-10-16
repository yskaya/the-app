import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

const DEFAULT_PORT = 5001;
const DEFAULT_FRONTEND = 'http://localhost:3000';

async function bootstrap() {
  const PORT = process.env.HTTP_AUTH_PORT || DEFAULT_PORT;
  const app = await NestFactory.create(AppModule);
  
  app.setGlobalPrefix('api'); 
  
  app.enableCors({
    origin: [process.env.FRONTEND_URL || DEFAULT_FRONTEND],
    credentials: true,
  });

  await app.listen(PORT);
  console.log(`auth service running on ${PORT}`);
}

bootstrap();
