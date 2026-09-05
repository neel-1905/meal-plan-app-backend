import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

import { CreateRecipeIngredientDto } from './create-recipe-ingredient.dto.js';
import { CreateRecipeInstructionDto } from './create-recipe-instruction.dto.js';
import { CreateRecipeNutritionDto } from './create-recipe-nutrition.dto.js';

export class CreateRecipeDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUrl()
  image?: string;

  @IsInt()
  @Min(1)
  cookingTime: number;

  @IsInt()
  @Min(1)
  servings: number;

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
