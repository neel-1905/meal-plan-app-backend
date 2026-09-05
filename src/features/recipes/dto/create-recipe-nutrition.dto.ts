import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsNumberString,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { CreateRecipeIngredientDto } from './create-recipe-ingredient.dto.js';
import { CreateRecipeInstructionDto } from './create-recipe-instruction.dto.js';

export class CreateRecipeNutritionDto {
  @IsOptional()
  @IsNumberString()
  calories?: string;

  @IsOptional()
  @IsNumberString()
  protein?: string;

  @IsOptional()
  @IsNumberString()
  carbohydrates?: string;

  @IsOptional()
  @IsNumberString()
  fat?: string;

  @IsOptional()
  @IsNumberString()
  fiber?: string;

  @IsOptional()
  @IsNumberString()
  sugar?: string;

  @IsOptional()
  @IsNumberString()
  sodium?: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateRecipeIngredientDto)
  ingredients: CreateRecipeIngredientDto[];

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateRecipeInstructionDto)
  instructions: CreateRecipeInstructionDto[];

  @IsArray()
  @IsUUID('4', { each: true })
  categoryIds: string[];

  @IsArray()
  @IsUUID('4', { each: true })
  dietTypeIds: string[];

  @IsArray()
  @IsUUID('4', { each: true })
  allergenIds: string[];

  @IsArray()
  @IsUUID('4', { each: true })
  foodIds: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateRecipeNutritionDto)
  nutrition?: CreateRecipeNutritionDto;
}
