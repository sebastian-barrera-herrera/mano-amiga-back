import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';
import type { FindMessagesQueryDto } from './dto/find-messages-query.dto';
import type { CommunityMessageRow } from './entities/community-message.entity';

const COLUMNS =
  'id, city, author_name, category, content, contact, user_id, is_hidden, created_at';

export interface InsertMessageInput {
  city: string;
  content: string;
  category: string;
  authorName: string | null;
  contact: string | null;
  userId: string | null;
}

type CountedRow = CommunityMessageRow & { total_count: string };

@Injectable()
export class CommunityRepository {
  constructor(private readonly db: DatabaseService) {}

  async findMany(
    query: FindMessagesQueryDto,
  ): Promise<{ rows: CommunityMessageRow[]; total: number }> {
    const conditions = ['is_hidden = FALSE'];
    const params: unknown[] = [];

    if (query.city) {
      params.push(`%${query.city}%`);
      conditions.push(`city ILIKE $${params.length}`);
    }
    if (query.category) {
      params.push(query.category);
      conditions.push(`category = $${params.length}`);
    }
    if (query.q) {
      params.push(`%${query.q}%`);
      conditions.push(`(content ILIKE $${params.length} OR city ILIKE $${params.length})`);
    }

    params.push(query.limit, (query.page - 1) * query.limit);

    const rows = await this.db.query<CountedRow>(
      `SELECT ${COLUMNS}, COUNT(*) OVER() AS total_count
         FROM community_messages
        WHERE ${conditions.join(' AND ')}
        ORDER BY created_at DESC
        LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );

    return { rows, total: rows.length > 0 ? Number(rows[0].total_count) : 0 };
  }

  findById(id: string): Promise<CommunityMessageRow | null> {
    return this.db.queryOne<CommunityMessageRow>(
      `SELECT ${COLUMNS} FROM community_messages WHERE id = $1`,
      [id],
    );
  }

  async insert(input: InsertMessageInput): Promise<CommunityMessageRow> {
    const row = await this.db.queryOne<CommunityMessageRow>(
      `INSERT INTO community_messages (city, content, category, author_name, contact, user_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING ${COLUMNS}`,
      [input.city, input.content, input.category, input.authorName, input.contact, input.userId],
    );
    return row!;
  }

  async delete(id: string): Promise<void> {
    await this.db.query('DELETE FROM community_messages WHERE id = $1', [id]);
  }

  /** Ciudades con más actividad, para sugerirlas en los filtros. */
  async topCities(limit = 12): Promise<string[]> {
    const rows = await this.db.query<{ city: string }>(
      `SELECT city
         FROM (
           SELECT city, COUNT(*) AS total
             FROM community_messages
            WHERE is_hidden = FALSE
            GROUP BY city
         ) AS grouped
        ORDER BY total DESC, city ASC
        LIMIT $1`,
      [limit],
    );
    return rows.map((row) => row.city);
  }
}
