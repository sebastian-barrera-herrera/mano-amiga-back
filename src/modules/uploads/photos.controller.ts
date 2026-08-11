import {
  Controller,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { PhotosService } from './photos.service';

@Controller('photos')
export class PhotosController {
  constructor(private readonly photos: PhotosService) {}

  /**
   * Recibe la imagen como cuerpo binario (no multipart): el navegador ya la ha
   * comprimido, así que no hace falta ninguna librería para procesar el envío.
   * El parser está registrado en `main.ts` para esta ruta.
   */
  @Post()
  @Throttle({ default: { limit: 15, ttl: 60_000 } })
  upload(@Req() request: Request): Promise<{ url: string; publicId: string }> {
    const baseUrl = `${request.protocol}://${request.get('host')}`;
    return this.photos.store(request.body as Buffer, baseUrl);
  }

  @Get(':id')
  // Las fotos nunca cambian de contenido, así que se pueden cachear siempre.
  @Header('Cache-Control', 'public, max-age=31536000, immutable')
  async serve(
    @Param('id', new ParseUUIDPipe({ errorHttpStatusCode: 404 })) id: string,
    @Res() response: Response,
  ): Promise<void> {
    const photo = await this.photos.find(id);
    response.setHeader('Content-Type', photo.mime);
    response.setHeader('Content-Length', photo.bytes.length);
    response.end(photo.bytes);
  }
}
