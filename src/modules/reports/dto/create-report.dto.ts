import { Type } from 'class-transformer';
import {
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
import { Trim, TrimToUndefined } from '../../../common/decorators/trim.decorator';
import {
  REPORT_KINDS,
  REPORT_STATUSES,
  type ReportKind,
  type ReportStatus,
} from '../entities/report.entity';

export class CreateReportDto {
  @IsIn(REPORT_KINDS, { message: 'kind debe ser person o pet' })
  kind: ReportKind;

  @IsIn(REPORT_STATUSES, { message: 'status debe ser missing o found' })
  status: ReportStatus;

  @IsOptional()
  @TrimToUndefined()
  @IsString()
  @MaxLength(140, { message: 'El nombre no puede superar 140 caracteres' })
  name?: string;

  @Trim()
  @IsString({ message: 'La ciudad es obligatoria' })
  @MinLength(2, { message: 'La ciudad es obligatoria' })
  @MaxLength(90)
  city: string;

  @IsOptional()
  @TrimToUndefined()
  @IsString()
  @MaxLength(120)
  neighborhood?: string;

  @IsOptional()
  @TrimToUndefined()
  @IsString()
  @MaxLength(300)
  locationDetail?: string;

  @IsOptional()
  @TrimToUndefined()
  @IsISO8601({}, { message: 'La fecha no es válida' })
  eventAt?: string;

  @IsOptional()
  @TrimToUndefined()
  @IsString()
  @MaxLength(2000, { message: 'La descripción no puede superar 2000 caracteres' })
  description?: string;

  @IsOptional()
  @TrimToUndefined()
  @Type(() => Number)
  @IsInt({ message: 'La edad debe ser un número' })
  @Min(0)
  @Max(120, { message: 'La edad no parece válida' })
  approxAge?: number;

  @IsOptional()
  @TrimToUndefined()
  @IsString()
  @MaxLength(300)
  clothing?: string;

  @IsOptional()
  @TrimToUndefined()
  @IsString()
  @MaxLength(500)
  healthStatus?: string;

  @IsOptional()
  @TrimToUndefined()
  @IsString()
  @MaxLength(60)
  species?: string;

  @IsOptional()
  @TrimToUndefined()
  @IsString()
  @MaxLength(90)
  color?: string;

  @IsOptional()
  @TrimToUndefined()
  // require_tld: false para aceptar http://localhost:3000 en desarrollo, que es
  // la URL que devuelve la API cuando las fotos se guardan en la base de datos.
  @IsUrl(
    { require_protocol: true, require_tld: false },
    { message: 'La URL de la foto no es válida' },
  )
  @MaxLength(500)
  photoUrl?: string;

  @IsOptional()
  @TrimToUndefined()
  @IsString()
  @MaxLength(300)
  photoPublicId?: string;

  @Trim()
  @IsString({ message: 'El nombre de contacto es obligatorio' })
  @MinLength(2, { message: 'El nombre de contacto es obligatorio' })
  @MaxLength(140)
  contactName: string;

  @IsOptional()
  @TrimToUndefined()
  @IsEmail({}, { message: 'El correo de contacto no es válido' })
  @MaxLength(180)
  contactEmail?: string;

  @IsOptional()
  @TrimToUndefined()
  @IsString()
  @MaxLength(40)
  contactPhone?: string;
}
