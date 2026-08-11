import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';
import type { UserRole, UserRow } from './entities/user.entity';

const COLUMNS = 'id, email, name, password_hash, google_sub, role, created_at, updated_at';

interface CreateUserInput {
  email: string;
  name: string | null;
  passwordHash: string | null;
  googleSub: string | null;
  role: UserRole;
}

@Injectable()
export class UsersRepository {
  constructor(private readonly db: DatabaseService) {}

  findById(id: string): Promise<UserRow | null> {
    return this.db.queryOne<UserRow>(`SELECT ${COLUMNS} FROM users WHERE id = $1`, [id]);
  }

  findByEmail(email: string): Promise<UserRow | null> {
    return this.db.queryOne<UserRow>(`SELECT ${COLUMNS} FROM users WHERE email = $1`, [
      email.toLowerCase(),
    ]);
  }

  async create(input: CreateUserInput): Promise<UserRow> {
    const row = await this.db.queryOne<UserRow>(
      `INSERT INTO users (email, name, password_hash, google_sub, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING ${COLUMNS}`,
      [input.email.toLowerCase(), input.name, input.passwordHash, input.googleSub, input.role],
    );
    return row!;
  }

  /** Vincula una cuenta de Google a un usuario ya existente creado por correo. */
  async attachGoogleSub(id: string, googleSub: string, name: string | null): Promise<UserRow> {
    const row = await this.db.queryOne<UserRow>(
      `UPDATE users
          SET google_sub = $2,
              name = COALESCE(name, $3)
        WHERE id = $1
       RETURNING ${COLUMNS}`,
      [id, googleSub, name],
    );
    return row!;
  }
}
