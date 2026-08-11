import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, type JwtModuleOptions } from '@nestjs/jwt';
import type { SignOptions } from 'jsonwebtoken';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { OptionalAuthGuard } from './guards/optional-auth.guard';
import { UsersRepository } from './users.repository';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): JwtModuleOptions => ({
        secret: config.get<string>('jwt.secret')!,
        // JwtModuleOptions tipa expiresIn como plantilla literal ("30d", "1h"…).
        signOptions: {
          expiresIn: config.get<string>('jwt.expiresIn') as SignOptions['expiresIn'],
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, UsersRepository, JwtAuthGuard, OptionalAuthGuard],
  exports: [AuthService, JwtAuthGuard, OptionalAuthGuard, JwtModule],
})
export class AuthModule {}
