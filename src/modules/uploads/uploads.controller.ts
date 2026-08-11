import { Controller, Get } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CloudinaryService, type UploadSignature } from './cloudinary.service';

export interface UploadStatus {
  enabled: boolean;
  /**
   * `cloudinary`: el navegador sube la foto directamente al CDN.
   * `database`: se envía a /api/photos y se guarda en PostgreSQL.
   */
  mode: 'cloudinary' | 'database';
  maxBytes: number;
}

@Controller('uploads')
export class UploadsController {
  constructor(private readonly cloudinary: CloudinaryService) {}

  /** El frontend lo consulta para saber a dónde enviar la foto. */
  @Get('status')
  status(): UploadStatus {
    return {
      enabled: true,
      mode: this.cloudinary.isEnabled ? 'cloudinary' : 'database',
      maxBytes: 4 * 1024 * 1024,
    };
  }

  @Get('signature')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  signature(): UploadSignature {
    return this.cloudinary.createUploadSignature();
  }
}
