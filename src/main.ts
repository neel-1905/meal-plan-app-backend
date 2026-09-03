import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ResponseInterceptor } from './common/http/interceptors/response.interceptor.js';
import { HttpExceptionFilter } from './common/http/filters/http-exception.filter.js';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  });

  app.setGlobalPrefix('api/v1', {
    exclude: ['api/auth/*path'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  app.useGlobalInterceptors(new ResponseInterceptor(app.get(Reflector)));

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
