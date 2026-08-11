import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Paginated } from '../../common/interfaces/paginated.interface';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalAuthGuard } from '../auth/guards/optional-auth.guard';
import { CommunityService } from './community.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { FindMessagesQueryDto } from './dto/find-messages-query.dto';
import type { CommunityMessage } from './entities/community-message.entity';

@Controller('community')
export class CommunityController {
  constructor(private readonly community: CommunityService) {}

  @Get()
  @UseGuards(OptionalAuthGuard)
  findAll(
    @Query() query: FindMessagesQueryDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<Paginated<CommunityMessage>> {
    return this.community.findAll(query, user);
  }

  @Get('cities')
  cities(): Promise<string[]> {
    return this.community.cities();
  }

  @Post()
  @UseGuards(OptionalAuthGuard)
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  create(@Body() dto: CreateMessageDto, @CurrentUser() user?: AuthUser): Promise<CommunityMessage> {
    return this.community.create(dto, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(
    @Param('id', new ParseUUIDPipe({ errorHttpStatusCode: 404 })) id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<{ deleted: true }> {
    return this.community.remove(id, user);
  }
}
