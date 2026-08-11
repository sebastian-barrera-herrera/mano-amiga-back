import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import type { Paginated } from '../../common/interfaces/paginated.interface';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalAuthGuard } from '../auth/guards/optional-auth.guard';
import { CreateReportDto } from './dto/create-report.dto';
import { FindReportsQueryDto } from './dto/find-reports-query.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import type { Report } from './entities/report.entity';
import type { ReportStats } from './reports.repository';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get()
  @UseGuards(OptionalAuthGuard)
  findAll(
    @Query() query: FindReportsQueryDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<Paginated<Report>> {
    return this.reports.findAll(query, user);
  }

  /** Antes de `:id` para que "stats" y "mine" no se interpreten como un id. */
  @Get('stats')
  stats(): Promise<ReportStats> {
    return this.reports.stats();
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  findMine(
    @Query() query: PaginationQueryDto,
    @CurrentUser() user: AuthUser,
  ): Promise<Paginated<Report>> {
    return this.reports.findMine(user, query.page, query.limit);
  }

  @Get(':id')
  @UseGuards(OptionalAuthGuard)
  findOne(
    @Param('id', new ParseUUIDPipe({ errorHttpStatusCode: 404 })) id: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<Report> {
    return this.reports.findOne(id, user);
  }

  /** Público: reportar no debería requerir cuenta durante una emergencia. */
  @Post()
  @UseGuards(OptionalAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  create(@Body() dto: CreateReportDto, @CurrentUser() user?: AuthUser): Promise<Report> {
    return this.reports.create(dto, user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id', new ParseUUIDPipe({ errorHttpStatusCode: 404 })) id: string,
    @Body() dto: UpdateReportDto,
    @CurrentUser() user: AuthUser,
  ): Promise<Report> {
    return this.reports.update(id, dto, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(
    @Param('id', new ParseUUIDPipe({ errorHttpStatusCode: 404 })) id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<{ deleted: true }> {
    return this.reports.remove(id, user);
  }
}
