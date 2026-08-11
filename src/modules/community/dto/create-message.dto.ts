import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Trim, TrimToUndefined } from '../../../common/decorators/trim.decorator';
import { MESSAGE_CATEGORIES, type MessageCategory } from '../entities/community-message.entity';

export class CreateMessageDto {
  @Trim()
  @IsString({ message: 'La ciudad es obligatoria' })
  @MinLength(2, { message: 'La ciudad es obligatoria' })
  @MaxLength(90)
  city: string;

  @Trim()
  @IsString({ message: 'Escribe el mensaje' })
  @MinLength(10, { message: 'El mensaje debe tener al menos 10 caracteres' })
  @MaxLength(1000, { message: 'El mensaje no puede superar 1000 caracteres' })
  content: string;

  @IsOptional()
  @IsIn(MESSAGE_CATEGORIES, { message: 'Categoría no válida' })
  category?: MessageCategory;

  @IsOptional()
  @TrimToUndefined()
  @IsString()
  @MaxLength(120)
  authorName?: string;

  /** Correo o teléfono en texto libre: aquí lo importante es que sea fácil. */
  @IsOptional()
  @TrimToUndefined()
  @IsString()
  @MaxLength(180)
  contact?: string;
}
