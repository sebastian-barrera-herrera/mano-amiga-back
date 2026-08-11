import {
  ConflictException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { type AuthUser, type PublicUser, toPublicUser, type UserRow } from './entities/user.entity';
import { UsersRepository } from './users.repository';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';

export interface AuthResult {
  token: string;
  user: PublicUser;
}

@Injectable()
export class AuthService {
  private readonly googleClient: OAuth2Client | null;

  constructor(
    private readonly users: UsersRepository,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {
    const clientId = this.config.get<string | null>('googleClientId');
    this.googleClient = clientId ? new OAuth2Client(clientId) : null;
  }

  get isGoogleEnabled(): boolean {
    return this.googleClient !== null;
  }

  async register(dto: RegisterDto): Promise<AuthResult> {
    const email = dto.email.toLowerCase();
    if (await this.users.findByEmail(email)) {
      throw new ConflictException('Ya existe una cuenta con este correo.');
    }

    const user = await this.users.create({
      email,
      name: dto.name ?? null,
      passwordHash: await bcrypt.hash(dto.password, 10),
      googleSub: null,
      role: this.resolveRole(email),
    });

    return this.buildResult(user);
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.users.findByEmail(dto.email);
    // Mismo mensaje en ambos casos para no revelar qué correos están registrados.
    if (!user?.password_hash || !(await bcrypt.compare(dto.password, user.password_hash))) {
      throw new UnauthorizedException('Correo o contraseña incorrectos.');
    }
    return this.buildResult(user);
  }

  async loginWithGoogle(credential: string): Promise<AuthResult> {
    if (!this.googleClient) {
      throw new ServiceUnavailableException('El inicio de sesión con Google no está configurado.');
    }

    let payload;
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: credential,
        audience: this.config.get<string>('googleClientId')!,
      });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException('No pudimos verificar tu cuenta de Google.');
    }

    if (!payload?.email || !payload.email_verified) {
      throw new UnauthorizedException('Tu cuenta de Google no tiene un correo verificado.');
    }

    const email = payload.email.toLowerCase();
    const existing = await this.users.findByEmail(email);
    const user = existing
      ? existing.google_sub
        ? existing
        : await this.users.attachGoogleSub(existing.id, payload.sub, payload.name ?? null)
      : await this.users.create({
          email,
          name: payload.name ?? null,
          passwordHash: null,
          googleSub: payload.sub,
          role: this.resolveRole(email),
        });

    return this.buildResult(user);
  }

  async findAuthUser(id: string): Promise<AuthUser | null> {
    const user = await this.users.findById(id);
    return user ? { id: user.id, email: user.email, role: user.role } : null;
  }

  async getProfile(id: string): Promise<PublicUser> {
    const user = await this.users.findById(id);
    if (!user) throw new UnauthorizedException('Sesión no válida.');
    return toPublicUser(user);
  }

  private resolveRole(email: string): 'user' | 'admin' {
    const admins = this.config.get<string[]>('adminEmails') ?? [];
    return admins.includes(email) ? 'admin' : 'user';
  }

  private async buildResult(user: UserRow): Promise<AuthResult> {
    const payload: AuthUser = { id: user.id, email: user.email, role: user.role };
    return {
      token: await this.jwt.signAsync({ sub: user.id, ...payload }),
      user: toPublicUser(user),
    };
  }
}
