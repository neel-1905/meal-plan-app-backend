import { PartialType } from '@nestjs/swagger';
import { CreateRecipeNutritionDto } from './create-recipe-nutrition.dto.js';

export class UpdateRecipeNutritionDto extends PartialType(
  CreateRecipeNutritionDto,
) {}
