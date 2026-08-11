import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Trim, TrimToNull } from '../../../common/decorators/trim.decorator';
import { REPORT_STATUSES, type ReportStatus } from '../entities/report.entity';

/**
 * Edición de un reporte propio. `kind` no se puede cambiar: si el tipo estaba
 * mal, es más claro eliminar el reporte y crear uno nuevo.
 */
export class UpdateReportDto {
  @IsOptional()
  @IsIn(REPORT_STATUSES)
  status?: ReportStatus;

  @IsOptional()
  @TrimToNull()
  @IsString()
  @MaxLength(140)
  name?: string | null;

  @IsOptional()
  @Trim()
  @IsString()
  @MinLength(2, { message: 'La ciudad es obligatoria' })
  @MaxLength(90)
  city?: string;

  @IsOptional()
  @TrimToNull()
  @IsString()
  @MaxLength(120)
  neighborhood?: string | null;

  @IsOptional()
  @TrimToNull()
  @IsString()
  @MaxLength(300)
  locationDetail?: string | null;

  @IsOptional()
  @TrimToNull()
  @IsISO8601({}, { message: 'La fecha no es válida' })
  eventAt?: string | null;

  @IsOptional()
  @TrimToNull()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @IsOptional()
  @TrimToNull()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(120)
  approxAge?: number | null;

  @IsOptional()
  @TrimToNull()
  @IsString()
  @MaxLength(300)
  clothing?: string | null;

  @IsOptional()
  @TrimToNull()
  @IsString()
  @MaxLength(500)
  healthStatus?: string | null;

  @IsOptional()
  @TrimToNull()
  @IsString()
  @MaxLength(60)
  species?: string | null;

  @IsOptional()
  @TrimToNull()
  @IsString()
  @MaxLength(90)
  color?: string | null;

  @IsOptional()
  @TrimToNull()
  @IsUrl({ require_protocol: true })
  @MaxLength(500)
  photoUrl?: string | null;

  @IsOptional()
  @TrimToNull()
  @IsString()
  @MaxLength(300)
  photoPublicId?: string | null;

  @IsOptional()
  @Trim()
  @IsString()
  @MinLength(2)
  @MaxLength(140)
  contactName?: string;

  @IsOptional()
  @TrimToNull()
  @IsEmail({}, { message: 'El correo de contacto no es válido' })
  @MaxLength(180)
  contactEmail?: string | null;

  @IsOptional()
  @TrimToNull()
  @IsString()
  @MaxLength(40)
  contactPhone?: string | null;

  /** Cierra el caso: la persona o mascota ya se reunió con su familia. */
  @IsOptional()
  @IsBoolean()
  resolved?: boolean;
}
