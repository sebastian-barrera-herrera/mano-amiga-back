import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'node:crypto';
import type { AppConfig } from '../../config/configuration';

export interface UploadSignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
  uploadUrl: string;
}

/**
 * El navegador sube la imagen directamente a Cloudinary con una firma emitida
 * aquí: el archivo nunca pasa por el servidor, lo que ahorra ancho de banda del
 * plan gratuito y hace la subida más rápida en redes móviles.
 */
@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);
  private readonly config: AppConfig['cloudinary'];

  constructor(configService: ConfigService) {
    this.config = configService.get<AppConfig['cloudinary']>('cloudinary') ?? null;
  }

  get isEnabled(): boolean {
    return this.config !== null;
  }

  createUploadSignature(): UploadSignature {
    if (!this.config) {
      throw new ServiceUnavailableException(
        'La subida de fotos no está configurada en este servidor.',
      );
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const signature = this.sign({ folder: this.config.folder, timestamp });

    return {
      cloudName: this.config.cloudName,
      apiKey: this.config.apiKey,
      timestamp,
      folder: this.config.folder,
      signature,
      uploadUrl: `https://api.cloudinary.com/v1_1/${this.config.cloudName}/image/upload`,
    };
  }

  /** Borra la imagen asociada a un reporte eliminado. Nunca interrumpe el flujo. */
  async destroy(publicId: string | null): Promise<void> {
    if (!publicId || !this.config) return;

    const timestamp = Math.floor(Date.now() / 1000);
    const body = new URLSearchParams({
      public_id: publicId,
      timestamp: String(timestamp),
      api_key: this.config.apiKey,
      signature: this.sign({ public_id: publicId, timestamp }),
    });

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${this.config.cloudName}/image/destroy`,
        { method: 'POST', body },
      );
      if (!response.ok) {
        this.logger.warn(`No se pudo borrar la imagen ${publicId}: HTTP ${response.status}`);
      }
    } catch (error) {
      this.logger.warn(
        `No se pudo borrar la imagen ${publicId}: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  /** Cloudinary firma los parámetros ordenados alfabéticamente + api_secret. */
  private sign(params: Record<string, string | number>): string {
    const payload = Object.keys(params)
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join('&');
    return createHash('sha1')
      .update(payload + this.config!.apiSecret)
      .digest('hex');
  }
}
