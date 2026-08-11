import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { paginate, type Paginated } from '../../common/interfaces/paginated.interface';
import type { AuthUser } from '../auth/entities/user.entity';
import { CommunityRepository } from './community.repository';
import type { CreateMessageDto } from './dto/create-message.dto';
import type { FindMessagesQueryDto } from './dto/find-messages-query.dto';
import { type CommunityMessage, toCommunityMessage } from './entities/community-message.entity';

@Injectable()
export class CommunityService {
  constructor(private readonly messages: CommunityRepository) {}

  async findAll(
    query: FindMessagesQueryDto,
    user?: AuthUser,
  ): Promise<Paginated<CommunityMessage>> {
    const { rows, total } = await this.messages.findMany(query);
    return paginate(
      rows.map((row) => toCommunityMessage(row, user?.id)),
      total,
      query.page,
      query.limit,
    );
  }

  async create(dto: CreateMessageDto, user?: AuthUser): Promise<CommunityMessage> {
    const row = await this.messages.insert({
      city: dto.city,
      content: dto.content,
      category: dto.category ?? 'info',
      authorName: dto.authorName ?? null,
      contact: dto.contact ?? null,
      userId: user?.id ?? null,
    });
    return toCommunityMessage(row, user?.id);
  }

  async remove(id: string, user: AuthUser): Promise<{ deleted: true }> {
    const row = await this.messages.findById(id);
    if (!row) throw new NotFoundException('No encontramos este mensaje.');
    if (user.role !== 'admin' && row.user_id !== user.id) {
      throw new ForbiddenException('Sólo puedes eliminar los mensajes que publicaste.');
    }
    await this.messages.delete(id);
    return { deleted: true };
  }

  cities(): Promise<string[]> {
    return this.messages.topCities();
  }
}
