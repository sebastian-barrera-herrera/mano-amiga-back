import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { AuthUser } from '../entities/user.entity';
import type { AuthenticatedRequest } from '../guards/optional-auth.guard';

/**
 * Con `JwtAuthGuard` siempre trae un usuario; con `OptionalAuthGuard` puede ser
 * `undefined` (publicación anónima).
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUser | undefined =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().user,
);
