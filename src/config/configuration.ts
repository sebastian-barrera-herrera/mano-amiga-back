export interface AppConfig {
  nodeEnv: 'development' | 'production' | 'test';
  port: number;
  databaseUrl: string;
  jwt: { secret: string; expiresIn: string };
  googleClientId: string | null;
  adminEmails: string[];
  cloudinary: {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
    folder: string;
  } | null;
}

export const configuration = (): AppConfig => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

  return {
    nodeEnv: (process.env.NODE_ENV as AppConfig['nodeEnv']) ?? 'development',
    port: Number(process.env.PORT) || 3000,
    databaseUrl: process.env.DATABASE_URL!,
    jwt: {
      secret: process.env.JWT_SECRET!,
      expiresIn: process.env.JWT_EXPIRES_IN?.trim() || '30d',
    },
    googleClientId: process.env.GOOGLE_CLIENT_ID?.trim() || null,
    adminEmails: (process.env.ADMIN_EMAILS ?? '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
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
