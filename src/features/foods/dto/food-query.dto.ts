import { IsOptional, IsString } from 'class-validator';

export class FoodQueryDto {
  @IsOptional()
  @IsString()
  search?: string;
}
