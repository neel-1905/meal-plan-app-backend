import { IsOptional, IsString, IsUUID } from 'class-validator';

import { QueryDto } from '../../../common/http/dto/query-dto.js';

export class RecipeQueryDto extends QueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsUUID('4')
  categoryId?: string;
}
