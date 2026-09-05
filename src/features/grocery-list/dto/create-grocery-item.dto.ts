import {
  IsBoolean,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateGroceryItemDto {
  @IsOptional()
  @IsUUID('4')
  ingredientId?: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsNumberString()
  quantity?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;
}
