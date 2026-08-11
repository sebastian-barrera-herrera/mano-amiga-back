import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

type OriginChecker = CorsOptions['origin'];

/**
 * Construye el validador de origen a partir de CORS_ORIGINS (lista separada por
 * comas). Sin valor o con `*` se permite cualquier origen, útil en desarrollo.
 */
export function corsOriginChecker(raw?: string): OriginChecker {
  const allowed = (raw ?? '')
    .split(',')
    .map((value) => value.trim().replace(/\/$/, ''))
    .filter(Boolean);

  if (allowed.length === 0 || allowed.includes('*')) return true;

  return (origin, callback) => {
    // Peticiones sin Origin (curl, health checks, apps nativas) se permiten.
    if (!origin || allowed.includes(origin.replace(/\/$/, ''))) {
      callback(null, true);
      return;
    }
    callback(new Error(`Origen no permitido por CORS: ${origin}`), false);
  };
}
