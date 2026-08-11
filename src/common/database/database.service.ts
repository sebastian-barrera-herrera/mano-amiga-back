import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, type QueryResultRow } from 'pg';

/** Errores de red o de cierre del servidor, no de la consulta en sí. */
const TRANSIENT_CODES = new Set([
  'ECONNRESET',
  'EPIPE',
  'ETIMEDOUT',
  '08006', // connection_failure
  '08003', // connection_does_not_exist
  '57P01', // admin_shutdown
]);

function isTransientConnectionError(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code;
  return typeof code === 'string' && TRANSIENT_CODES.has(code);
}

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private readonly pool: Pool;

  constructor(config: ConfigService) {
    const connectionString = config.get<string>('databaseUrl')!;
    const isLocal = /localhost|127\.0\.0\.1/.test(connectionString);

    this.pool = new Pool({
      connectionString,
      // Neon usa un certificado de una CA pública, así que se verifica de
      // verdad. `DATABASE_SSL_NO_VERIFY=true` es la salida de emergencia para
      // servidores con certificado autofirmado.
      ssl: isLocal
        ? undefined
        : { rejectUnauthorized: process.env.DATABASE_SSL_NO_VERIFY !== 'true' },
      // El plan gratuito de Neon tiene pocas conexiones: mantenemos el pool corto.
      max: Number(process.env.DATABASE_POOL_MAX) || 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });

    this.pool.on('error', (error) => this.logger.error(`Pool de PostgreSQL: ${error.message}`));
  }

  async onModuleInit(): Promise<void> {
    await this.pool.query('SELECT 1');
    this.logger.log('Conexión a PostgreSQL establecida');
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }

  async query<T extends QueryResultRow>(text: string, params: unknown[] = []): Promise<T[]> {
    try {
      const result = await this.pool.query<T>(text, params as never[]);
      return result.rows;
    } catch (error) {
      if (!isTransientConnectionError(error)) throw error;
      // El plan gratuito de Neon suspende la base tras un rato de inactividad:
      // la primera consulta puede encontrar una conexión ya cerrada.
      this.logger.warn('Conexión perdida con PostgreSQL, reintentando una vez');
      const result = await this.pool.query<T>(text, params as never[]);
      return result.rows;
    }
  }

  async queryOne<T extends QueryResultRow>(text: string, params: unknown[] = []): Promise<T | null> {
    const rows = await this.query<T>(text, params);
    return rows[0] ?? null;
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.pool.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }
}
