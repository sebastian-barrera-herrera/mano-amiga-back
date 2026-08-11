import { Transform } from 'class-transformer';

/**
 * Los formularios envían con frecuencia espacios sobrantes (sobre todo al
 * pegar un correo). Se normaliza antes de validar para no rechazar datos
 * que en realidad son correctos.
 */
export const Trim = () =>
  Transform(({ value }) => (typeof value === 'string' ? value.trim() : value));

/** Igual que `Trim`, pero un texto vacío se trata como "no enviado". */
export const TrimToUndefined = () =>
  Transform(({ value }) => (typeof value === 'string' ? value.trim() || undefined : value));

/** Para actualizaciones: un texto vacío significa "borrar este dato". */
export const TrimToNull = () =>
  Transform(({ value }) => (typeof value === 'string' ? value.trim() || null : value));
