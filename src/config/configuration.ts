export interface AppConfig {
  nodeEnv: 'development' | 'production' | 'test';
  port: number;
  databaseUrl: string;
  jwt: { secret: string; expiresIn: string };
  googleClientId: string | null;
  adminEmails: string[];
  /** URL pública de la API, para construir los enlaces de las fotos guardadas
   *  en la base de datos. Si falta, se deduce de cada petición. */
  publicApiUrl: string | null;
  cloudinary: {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
    folder: string;
  } | null;
}

/**
 * Al pegar una credencial en el panel de Render o Netlify es muy fácil arrastrar
 * un espacio, un salto de línea o las comillas. El valor llega distinto y el
 * error que se ve después ("password authentication failed") no apunta a la
 * causa real, así que se limpia aquí.
 */
function cleanSecret(value: string | undefined): string | undefined {
  return value?.trim().replace(/^["']|["']$/g, '');
}

export const configuration = (): AppConfig => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

  return {
    nodeEnv: (process.env.NODE_ENV as AppConfig['nodeEnv']) ?? 'development',
    port: Number(process.env.PORT) || 3000,
    databaseUrl: cleanSecret(process.env.DATABASE_URL)!,
    jwt: {
      secret: cleanSecret(process.env.JWT_SECRET)!,
      expiresIn: process.env.JWT_EXPIRES_IN?.trim() || '30d',
    },
    googleClientId: process.env.GOOGLE_CLIENT_ID?.trim() || null,
    adminEmails: (process.env.ADMIN_EMAILS ?? '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
    publicApiUrl: process.env.PUBLIC_API_URL?.trim() || null,
    // Sin credenciales completas la app sigue funcionando, sólo sin fotos.
    cloudinary:
      cloudName && apiKey && apiSecret
        ? {
            cloudName,
            apiKey,
            apiSecret,
            folder: process.env.CLOUDINARY_FOLDER?.trim() || 'manoamiga',
          }
        : null,
  };
};
