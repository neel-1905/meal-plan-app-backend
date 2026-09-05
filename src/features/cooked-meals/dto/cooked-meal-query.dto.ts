import { IsDateString, IsOptional } from 'class-validator';

export class CookedMealQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
