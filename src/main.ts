import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  });

  app.setGlobalPrefix('api/v1', {
    exclude: ['api/auth/*path'],
  });

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
