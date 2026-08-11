import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { Trim } from '../../../common/decorators/trim.decorator';

export class LoginDto {
  @Trim()
  @IsEmail({}, { message: 'Ingresa un correo válido' })
  @MaxLength(180)
  email: string;

  @IsString()
  @MinLength(1, { message: 'Ingresa tu contraseña' })
  @MaxLength(72)
  password: string;
}
