import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from './common/database/database.module';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware';
import { configuration } from './config/configuration';
import { validateEnv } from './config/env.validation';
import { AuthModule } from './modules/auth/auth.module';
import { CommunityModule } from './modules/community/community.module';
import { HealthModule } from './modules/health/health.module';
import { ReportsModule } from './modules/reports/reports.module';
import { UploadsModule } from './modules/uploads/uploads.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [configuration],
      validate: validateEnv,
      envFilePath: ['.env', '.env.local'],
    }),
    // La app es de escritura pública: el límite por IP es la primera barrera
    // frente a spam durante una emergencia.
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 90 }]),
    DatabaseModule,
    AuthModule,
    UploadsModule,
    ReportsModule,
    CommunityModule,
    HealthModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // Sintaxis de comodín de Express 5 (path-to-regexp v8): incluye la raíz.
    consumer.apply(RequestLoggerMiddleware).forRoutes('{*path}');
  }
}
