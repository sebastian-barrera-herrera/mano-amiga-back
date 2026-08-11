import { IsString, MaxLength, MinLength } from 'class-validator';

export class GoogleLoginDto {
  /** ID token (JWT) devuelto por Google Identity Services en el navegador. */
  @IsString()
  @MinLength(20, { message: 'Token de Google inválido' })
  @MaxLength(4096)
  credential: string;
}
