import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { TrimToUndefined } from '../../../common/decorators/trim.decorator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { MESSAGE_CATEGORIES, type MessageCategory } from '../entities/community-message.entity';

export class FindMessagesQueryDto extends PaginationQueryDto {
  @IsOptional()
  @TrimToUndefined()
  @IsString()
  @MaxLength(90)
  city?: string;

  @IsOptional()
  @IsIn(MESSAGE_CATEGORIES, { message: 'Categoría no válida' })
  category?: MessageCategory;

  @IsOptional()
  @TrimToUndefined()
  @IsString()
  @MaxLength(120)
  q?: string;
}
