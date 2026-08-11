import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';

export interface StoredPhoto {
  id: string;
  mime: string;
  bytes: Buffer;
}

@Injectable()
export class PhotosRepository {
  constructor(private readonly db: DatabaseService) {}

  async insert(mime: string, bytes: Buffer): Promise<string> {
    const row = await this.db.queryOne<{ id: string }>(
      `INSERT INTO photos (mime, bytes, size_bytes) VALUES ($1, $2, $3) RETURNING id`,
      [mime, bytes, bytes.length],
    );
    return row!.id;
  }

  findById(id: string): Promise<StoredPhoto | null> {
    return this.db.queryOne<StoredPhoto>('SELECT id, mime, bytes FROM photos WHERE id = $1', [id]);
  }

  async delete(id: string): Promise<void> {
    await this.db.query('DELETE FROM photos WHERE id = $1', [id]);
  }

  /**
   * Borra las fotos que se subieron pero cuyo formulario nunca se envió. Sin
   * esto, los 0,5 GB del plan gratuito de Neon se llenarían con imágenes que no
   * están en ningún reporte.
   */
  async deleteOrphans(): Promise<number> {
    const rows = await this.db.query<{ id: string }>(
      `DELETE FROM photos
        WHERE created_at < now() - INTERVAL '2 days'
          AND NOT EXISTS (
            SELECT 1 FROM reports r WHERE r.photo_public_id = 'db:' || photos.id::text
          )
       RETURNING id`,
    );
    return rows.length;
  }
}
