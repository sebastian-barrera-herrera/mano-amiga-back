import { Controller, Get } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CloudinaryService, type UploadSignature } from './cloudinary.service';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly cloudinary: CloudinaryService) {}

  /** El frontend consulta esto antes de mostrar el selector de foto. */
  @Get('status')
  status(): { enabled: boolean } {
    return { enabled: this.cloudinary.isEnabled };
  }

  @Get('signature')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  signature(): UploadSignature {
    return this.cloudinary.createUploadSignature();
  }
}
