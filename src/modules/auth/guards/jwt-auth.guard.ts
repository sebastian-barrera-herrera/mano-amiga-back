import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { AuthUser } from '../entities/user.entity';
import { type AuthenticatedRequest, extractBearerToken } from './optional-auth.guard';

/** Exige un token válido. Se usa sólo en las rutas de administración. */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = extractBearerToken(request);
    if (!token) throw new UnauthorizedException('Inicia sesión para continuar.');

    try {
      const payload = await this.jwt.verifyAsync<AuthUser & { sub: string }>(token);
      request.user = { id: payload.sub, email: payload.email, role: payload.role };
      return true;
    } catch {
      throw new UnauthorizedException('Tu sesión expiró. Inicia sesión de nuevo.');
    }
  }
}
