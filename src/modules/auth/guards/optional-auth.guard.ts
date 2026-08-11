import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import type { AuthUser } from '../entities/user.entity';

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  const token = header.slice(7).trim();
  return token || null;
}

/**
 * Deja pasar siempre. Si hay un token válido, adjunta `request.user` para que
 * el reporte quede asociado a la cuenta y pueda administrarse después.
 */
@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = extractBearerToken(request);
    if (!token) return true;

    try {
      const payload = await this.jwt.verifyAsync<AuthUser & { sub: string }>(token);
      request.user = { id: payload.sub, email: payload.email, role: payload.role };
    } catch {
      /* token inválido o expirado: se continúa como anónimo */
    }
    return true;
  }
}
