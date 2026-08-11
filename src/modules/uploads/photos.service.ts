import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PhotosRepository, type StoredPhoto } from './photos.repository';

export const MAX_PHOTO_BYTES = 4 * 1024 * 1024;

/** Prefijo que marca una foto guardada en la base de datos. */
const DB_PREFIX = 'db:';

const SIGNATURES: Array<{ mime: string; matches: (b: Buffer) => boolean }> = [
  { mime: 'image/jpeg', matches: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    mime: 'image/png',
    matches: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  },
  {
    mime: 'image/webp',
    matches: (b) => b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8, 12).toString() === 'WEBP',
  },
];

@Injectable()
export class PhotosService {
  private readonly logger = new Logger(PhotosService.name);

  constructor(
    private readonly photos: PhotosRepository,
    private readonly config: ConfigService,
  ) {}

  static isDatabasePhoto(publicId: string | null): boolean {
    return Boolean(publicId?.startsWith(DB_PREFIX));
  }

  async store(bytes: Buffer, baseUrl: string): Promise<{ url: string; publicId: string }> {
    if (!Buffer.isBuffer(bytes) || bytes.length === 0) {
      throw new BadRequestException('No recibimos la imagen. Intenta de nuevo.');
    }
    if (bytes.length > MAX_PHOTO_BYTES) {
      throw new BadRequestException('La foto es demasiado grande (máximo 4 MB).');
    }

    // El tipo declarado por el navegador no basta: se comprueba la firma real
    // del archivo para no guardar cualquier cosa en la base de datos.
    const mime = SIGNATURES.find(({ matches }) => matches(bytes))?.mime;
    if (!mime) {
      throw new BadRequestException('El archivo no es una imagen JPG, PNG o WEBP.');
    }

    const id = await this.photos.insert(mime, bytes);
    void this.cleanUpOrphans();

    return {
      url: `${this.publicBaseUrl(baseUrl)}/api/photos/${id}`,
      publicId: `${DB_PREFIX}${id}`,
    };
  }

  async find(id: string): Promise<StoredPhoto> {
    const photo = await this.photos.findById(id);
    if (!photo) throw new NotFoundException('No encontramos esta imagen.');
    return photo;
  }

  /** Acepta tanto el id suelto como el `publicId` con prefijo. */
  async remove(publicId: string | null): Promise<void> {
    if (!PhotosService.isDatabasePhoto(publicId)) return;
    try {
      await this.photos.delete(publicId!.slice(DB_PREFIX.length));
    } catch (error) {
      this.logger.warn(
        `No se pudo borrar la foto ${publicId}: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  private publicBaseUrl(requestBaseUrl: string): string {
    const configured = this.config.get<string | null>('publicApiUrl');
    return (configured ?? requestBaseUrl).replace(/\/+$/, '');
  }

  private async cleanUpOrphans(): Promise<void> {
    try {
      const removed = await this.photos.deleteOrphans();
      if (removed > 0) this.logger.log(`Se liberaron ${removed} foto(s) sin reporte asociado`);
    } catch (error) {
      this.logger.warn(
        `Falló la limpieza de fotos huérfanas: ${error instanceof Error ? error.message : error}`,
      );
    }
  }
}
