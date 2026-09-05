import { IsDateString, IsOptional } from 'class-validator';

export class MealPlanQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
