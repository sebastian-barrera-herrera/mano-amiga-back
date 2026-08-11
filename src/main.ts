import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { corsOriginChecker } from './config/cors';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: false,
    logger: ['error', 'warn', 'log'],
  });

  // Render/Netlify van detrás de un proxy: necesario para que el rate limit
  // vea la IP real del cliente y no la del balanceador.
  app.set('trust proxy', 1);

  app.setGlobalPrefix('api');
  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.enableCors({
    origin: corsOriginChecker(process.env.CORS_ORIGINS),
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableShutdownHooks();

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port, '0.0.0.0');
  new Logger('Bootstrap').log(`ManoAmiga API escuchando en http://localhost:${port}/api`);
}

void bootstrap();
