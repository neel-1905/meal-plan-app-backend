import {
  IsBoolean,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateRecipeIngredientDto {
  @IsUUID('4')
  ingredientId: string;

  @IsNumberString()
  quantity: string;

  @IsString()
  unit: string;

  @IsOptional()
  @IsString()
  preparation?: string;

  @IsBoolean()
  isOptional: boolean = false;
}
