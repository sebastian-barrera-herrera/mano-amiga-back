import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';
import type { FindReportsQueryDto } from './dto/find-reports-query.dto';
import type { ReportRow } from './entities/report.entity';

const COLUMNS = `
  id, kind, status, name, description, photo_url, photo_public_id, city, neighborhood,
  location_detail, event_at, approx_age, clothing, health_status, species, color,
  contact_name, contact_email, contact_phone, user_id, resolved_at, is_hidden,
  created_at, updated_at
`;

/** Campos que la API acepta y su columna en la base de datos. */
const UPDATABLE: Record<string, string> = {
  status: 'status',
  name: 'name',
  city: 'city',
  neighborhood: 'neighborhood',
  locationDetail: 'location_detail',
  eventAt: 'event_at',
  description: 'description',
  approxAge: 'approx_age',
  clothing: 'clothing',
  healthStatus: 'health_status',
  species: 'species',
  color: 'color',
  photoUrl: 'photo_url',
  photoPublicId: 'photo_public_id',
  contactName: 'contact_name',
  contactEmail: 'contact_email',
  contactPhone: 'contact_phone',
};

export interface InsertReportInput {
  kind: string;
  status: string;
  name: string | null;
  description: string | null;
  photoUrl: string | null;
  photoPublicId: string | null;
  city: string;
  neighborhood: string | null;
  locationDetail: string | null;
  eventAt: string | null;
  approxAge: number | null;
  clothing: string | null;
  healthStatus: string | null;
  species: string | null;
  color: string | null;
  contactName: string;
  contactEmail: string | null;
  contactPhone: string | null;
  userId: string | null;
}

export interface ReportStats {
  personsMissing: number;
  personsFound: number;
  petsMissing: number;
  petsFound: number;
  resolved: number;
  total: number;
}

type CountedRow = ReportRow & { total_count: string };

@Injectable()
export class ReportsRepository {
  constructor(private readonly db: DatabaseService) {}

  async findMany(
    query: FindReportsQueryDto,
  ): Promise<{ rows: ReportRow[]; total: number }> {
    const conditions = ['is_hidden = FALSE'];
    const params: unknown[] = [];

    if (query.kind) {
      params.push(query.kind);
      conditions.push(`kind = $${params.length}`);
    }
    if (query.status) {
      params.push(query.status);
      conditions.push(`status = $${params.length}`);
    }
    if (query.city) {
      params.push(`%${query.city}%`);
      conditions.push(`city ILIKE $${params.length}`);
    }
    if (query.q) {
      params.push(`%${query.q}%`);
      const p = `$${params.length}`;
      conditions.push(`(
        COALESCE(name, '') ILIKE ${p}
        OR city ILIKE ${p}
        OR COALESCE(neighborhood, '') ILIKE ${p}
        OR COALESCE(description, '') ILIKE ${p}
        OR COALESCE(species, '') ILIKE ${p}
      )`);
    }
    if (query.resolution === 'open') conditions.push('resolved_at IS NULL');
    if (query.resolution === 'resolved') conditions.push('resolved_at IS NOT NULL');

    params.push(query.limit, (query.page - 1) * query.limit);

    // COUNT(*) OVER() evita una segunda consulta para el total de la paginación.
    const rows = await this.db.query<CountedRow>(
      `SELECT ${COLUMNS}, COUNT(*) OVER() AS total_count
         FROM reports
        WHERE ${conditions.join(' AND ')}
        ORDER BY created_at DESC
        LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );

    return { rows, total: rows.length > 0 ? Number(rows[0].total_count) : 0 };
  }

  async findByUser(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ rows: ReportRow[]; total: number }> {
    const rows = await this.db.query<CountedRow>(
      `SELECT ${COLUMNS}, COUNT(*) OVER() AS total_count
         FROM reports
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3`,
      [userId, limit, (page - 1) * limit],
    );
    return { rows, total: rows.length > 0 ? Number(rows[0].total_count) : 0 };
  }

  findById(id: string): Promise<ReportRow | null> {
    return this.db.queryOne<ReportRow>(`SELECT ${COLUMNS} FROM reports WHERE id = $1`, [id]);
  }

  async insert(input: InsertReportInput): Promise<ReportRow> {
    const row = await this.db.queryOne<ReportRow>(
      `INSERT INTO reports (
         kind, status, name, description, photo_url, photo_public_id, city, neighborhood,
         location_detail, event_at, approx_age, clothing, health_status, species, color,
         contact_name, contact_email, contact_phone, user_id
       ) VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
       )
       RETURNING ${COLUMNS}`,
      [
        input.kind,
        input.status,
        input.name,
        input.description,
        input.photoUrl,
        input.photoPublicId,
        input.city,
        input.neighborhood,
        input.locationDetail,
        input.eventAt,
        input.approxAge,
        input.clothing,
        input.healthStatus,
        input.species,
        input.color,
        input.contactName,
        input.contactEmail,
        input.contactPhone,
        input.userId,
      ],
    );
    return row!;
  }

  /** `resolved` se traduce a `resolved_at` (fecha de cierre o `NULL`). */
  async update(
    id: string,
    changes: Record<string, unknown>,
    resolved?: boolean,
  ): Promise<ReportRow | null> {
    const assignments: string[] = [];
    const params: unknown[] = [id];

    for (const [field, value] of Object.entries(changes)) {
      const column = UPDATABLE[field];
      if (!column || value === undefined) continue;
      params.push(value);
      assignments.push(`${column} = $${params.length}`);
    }

    if (resolved !== undefined) {
      assignments.push(resolved ? 'resolved_at = now()' : 'resolved_at = NULL');
    }
    if (assignments.length === 0) return this.findById(id);

    return this.db.queryOne<ReportRow>(
      `UPDATE reports SET ${assignments.join(', ')} WHERE id = $1 RETURNING ${COLUMNS}`,
      params,
    );
  }

  async delete(id: string): Promise<void> {
    await this.db.query('DELETE FROM reports WHERE id = $1', [id]);
  }

  async stats(): Promise<ReportStats> {
    const row = await this.db.queryOne<Record<string, string>>(
      `SELECT
         COUNT(*) FILTER (WHERE kind = 'person' AND status = 'missing' AND resolved_at IS NULL) AS persons_missing,
         COUNT(*) FILTER (WHERE kind = 'person' AND status = 'found'   AND resolved_at IS NULL) AS persons_found,
         COUNT(*) FILTER (WHERE kind = 'pet'    AND status = 'missing' AND resolved_at IS NULL) AS pets_missing,
         COUNT(*) FILTER (WHERE kind = 'pet'    AND status = 'found'   AND resolved_at IS NULL) AS pets_found,
         COUNT(*) FILTER (WHERE resolved_at IS NOT NULL) AS resolved,
         COUNT(*) AS total
       FROM reports
       WHERE is_hidden = FALSE`,
    );

    return {
      personsMissing: Number(row?.persons_missing ?? 0),
      personsFound: Number(row?.persons_found ?? 0),
      petsMissing: Number(row?.pets_missing ?? 0),
      petsFound: Number(row?.pets_found ?? 0),
      resolved: Number(row?.resolved ?? 0),
      total: Number(row?.total ?? 0),
    };
  }
}
