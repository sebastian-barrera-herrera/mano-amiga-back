import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { TrimToUndefined } from '../../../common/decorators/trim.decorator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import {
  REPORT_KINDS,
  REPORT_STATUSES,
  type ReportKind,
  type ReportStatus,
} from '../entities/report.entity';

export class FindReportsQueryDto extends PaginationQueryDto {
  /** Texto libre: busca en nombre, ciudad, barrio y descripción. */
  @IsOptional()
  @TrimToUndefined()
  @IsString()
  @MaxLength(120)
  q?: string;

  @IsOptional()
  @IsIn(REPORT_KINDS, { message: 'kind debe ser person o pet' })
  kind?: ReportKind;

  @IsOptional()
  @IsIn(REPORT_STATUSES, { message: 'status debe ser missing o found' })
  status?: ReportStatus;

  @IsOptional()
  @TrimToUndefined()
  @IsString()
  @MaxLength(90)
  city?: string;

  /** `open` (por defecto) oculta los casos ya resueltos. */
  @IsOptional()
  @IsIn(['open', 'resolved', 'all'])
  resolution?: 'open' | 'resolved' | 'all' = 'open';
}
