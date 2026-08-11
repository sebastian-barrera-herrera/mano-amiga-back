#!/usr/bin/env node
/**
 * Migraciones y datos de ejemplo sin dependencias extra.
 *   node scripts/db.mjs migrate   → aplica los .sql de db/migrations pendientes
 *   node scripts/db.mjs seed      → carga db/seed.sql (sólo para desarrollo)
 */
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const here = dirname(fileURLToPath(import.meta.url));
const apiRoot = join(here, '..');

async function loadEnv() {
  // Carga apps/api/.env sin depender de dotenv (Render/Neon ya inyectan las vars).
  try {
    const raw = await readFile(join(apiRoot, '.env'), 'utf8');
    for (const line of raw.split('\n')) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
      if (!match) continue;
      const [, key, value] = match;
      if (process.env[key] === undefined) {
        process.env[key] = value.replace(/^["']|["']$/g, '');
      }
    }
  } catch {
    /* sin archivo .env: se usan las variables del entorno */
  }
}

/**
 * Describe la cadena de conexión sin revelar la contraseña: los logs de Render
 * son visibles y no deben contener credenciales. Deja ver la forma, que es lo
 * que hace falta para detectar un recorte o un espacio de más.
 */
function describeUrl(raw) {
  const value = raw.trim();
  if (!value) return '(vacía)';
  const avisos = [];
  if (raw !== value) avisos.push('¡tiene espacios o saltos de línea alrededor!');
  if (/^["']|["']$/.test(value)) avisos.push('¡tiene comillas alrededor!');
  try {
    const url = new URL(value);
    const partes = [
      `usuario=${url.username || '(falta)'}`,
      `contraseña=${url.password ? `${url.password.length} caracteres` : '(falta)'}`,
      `host=${url.hostname || '(falta)'}`,
      `base=${url.pathname.replace('/', '') || '(falta)'}`,
      `sslmode=${url.searchParams.get('sslmode') ?? '(sin definir)'}`,
    ];
    return [...partes, ...avisos].join(' · ');
  } catch {
    return [`no tiene forma de URL (empieza por "${value.slice(0, 12)}…")`, ...avisos].join(' · ');
  }
}

function createClient() {
  // Se limpian espacios y comillas: es el error más común al pegar la cadena
  // en el panel de Render, y el fallo posterior no apunta a la causa.
  const connectionString = process.env.DATABASE_URL?.trim().replace(/^["']|["']$/g, '');
  if (!connectionString) {
    console.error('✗ Falta DATABASE_URL. Copia apps/api/.env.example a apps/api/.env');
    process.exit(1);
  }
  const isLocal = /localhost|127\.0\.0\.1/.test(connectionString);
  return new pg.Client({
    connectionString,
    ssl: isLocal
      ? undefined
      : { rejectUnauthorized: process.env.DATABASE_SSL_NO_VERIFY !== 'true' },
  });
}

async function migrate(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name       TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  const dir = join(apiRoot, 'db', 'migrations');
  const files = (await readdir(dir)).filter((f) => f.endsWith('.sql')).sort();
  const { rows } = await client.query('SELECT name FROM schema_migrations');
  const applied = new Set(rows.map((r) => r.name));

  let count = 0;
  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = await readFile(join(dir, file), 'utf8');
    process.stdout.write(`→ aplicando ${file} ... `);
    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
      await client.query('COMMIT');
      console.log('ok');
      count++;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  }
  console.log(count ? `✓ ${count} migración(es) aplicada(s)` : '✓ base de datos al día');
}

async function seed(client) {
  if (process.env.NODE_ENV === 'production') {
    console.error('✗ No se ejecutan datos de ejemplo con NODE_ENV=production');
    process.exit(1);
  }
  const sql = await readFile(join(apiRoot, 'db', 'seed.sql'), 'utf8');
  await client.query(sql);
  console.log('✓ datos de ejemplo cargados');
}

const command = process.argv[2];
if (!['migrate', 'seed'].includes(command)) {
  console.error('Uso: node scripts/db.mjs <migrate|seed>');
  process.exit(1);
}

await loadEnv();
const client = createClient();
try {
  await client.connect();
  await (command === 'migrate' ? migrate(client) : seed(client));
} catch (error) {
  console.error(`✗ ${error.message}`);
  if (/password authentication failed|role .* does not exist/i.test(error.message)) {
    const url = process.env.DATABASE_URL ?? '';
    console.error(
      '\n  DATABASE_URL no coincide con la base de datos. Revisa, por este orden:\n' +
        '   1. Que sea la cadena actual de Neon (si rotaste la contraseña, la anterior ya no sirve).\n' +
        '   2. Que no lleve espacios ni comillas alrededor al pegarla en el panel.\n' +
        '   3. Que esté completa: usuario, contraseña, host, base y ?sslmode=verify-full.\n' +
        `\n  Lo que se está usando: ${describeUrl(url)}`,
    );
  }
  process.exitCode = 1;
} finally {
  await client.end();
}
