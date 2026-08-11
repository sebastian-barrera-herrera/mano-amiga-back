const REQUIRED = ['DATABASE_URL', 'JWT_SECRET'] as const;

/**
 * Se ejecuta al arrancar: es preferible fallar de inmediato que descubrir una
 * variable ausente en la primera petición de un usuario.
 */
export function validateEnv(config: Record<string, unknown>): Record<string, unknown> {
  const missing = REQUIRED.filter((key) => !String(config[key] ?? '').trim());
  if (missing.length > 0) {
    throw new Error(
      `Faltan variables de entorno obligatorias: ${missing.join(', ')}. ` +
        'Copia apps/api/.env.example a apps/api/.env y complétalas.',
    );
  }

  const secret = String(config.JWT_SECRET);
  if (config.NODE_ENV === 'production' && secret.length < 32) {
    throw new Error('JWT_SECRET debe tener al menos 32 caracteres en producción.');
  }

  return config;
}
