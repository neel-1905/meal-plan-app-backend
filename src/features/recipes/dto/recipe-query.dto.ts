import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

import { QueryDto } from '../../../common/http/dto/query-dto.js';
import { Type } from 'class-transformer';

export class RecipeQueryDto extends QueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsUUID('4')
  categoryId?: string;

  @IsOptional()
  @IsUUID('4')
  dietTypeId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxCookingTime?: number;
}
