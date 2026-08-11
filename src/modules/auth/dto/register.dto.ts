import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Trim, TrimToUndefined } from '../../../common/decorators/trim.decorator';

export class RegisterDto {
  @Trim()
  @IsEmail({}, { message: 'Ingresa un correo válido' })
  @MaxLength(180)
  email: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(72, { message: 'La contraseña no puede superar 72 caracteres' })
  password: string;

  @IsOptional()
  @TrimToUndefined()
  @IsString()
  @MaxLength(120)
  name?: string;
}
