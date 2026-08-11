import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

type OriginChecker = CorsOptions['origin'];

const normalize = (value: string) => value.trim().replace(/\/$/, '');

/**
 * Convierte una entrada de CORS_ORIGINS en un comprobador. Se admite `*` dentro
 * del dominio para cubrir las URL de previsualización de Netlify, que cambian
 * en cada rama: `https://*--misitio.netlify.app`.
 */
function toMatcher(entry: string): (origin: string) => boolean {
  if (!entry.includes('*')) return (origin) => origin === entry;

  const pattern = entry
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // escapa los metacaracteres
    .replace(/\\\*/g, '[^/]*'); // y devuelve al comodín su significado
  const regex = new RegExp(`^${pattern}$`);
  return (origin) => regex.test(origin);
}

/**
 * Construye el validador de origen a partir de CORS_ORIGINS (lista separada por
 * comas). Sin valor o con `*` se permite cualquier origen, útil en desarrollo.
 */
export function corsOriginChecker(raw?: string): OriginChecker {
  const allowed = (raw ?? '').split(',').map(normalize).filter(Boolean);

  if (allowed.length === 0 || allowed.includes('*')) return true;

  const matchers = allowed.map(toMatcher);

  return (origin, callback) => {
    // Peticiones sin Origin (curl, health checks, apps nativas) se permiten.
    // Un origen no autorizado se rechaza sin cabecera CORS en lugar de lanzar
    // un error: el navegador lo bloquea igual y el servidor no responde 500.
    const allowedOrigin = !origin || matchers.some((matches) => matches(normalize(origin)));
    callback(null, allowedOrigin);
  };
}
