export type UserRole = 'user' | 'admin';

/** Fila tal como vive en PostgreSQL. */
export interface UserRow {
  id: string;
  email: string;
  name: string | null;
  password_hash: string | null;
  google_sub: string | null;
  role: UserRole;
  created_at: Date;
  updated_at: Date;
}

/** Usuario expuesto por la API (nunca incluye el hash de la contraseña). */
export interface PublicUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  createdAt: string;
}

export function toPublicUser(row: UserRow): PublicUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    createdAt: row.created_at.toISOString(),
  };
}

/** Contenido del JWT y de `request.user`. */
export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}
