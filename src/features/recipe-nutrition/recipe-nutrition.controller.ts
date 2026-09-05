import { Controller } from '@nestjs/common';
import { RecipeNutritionService } from './recipe-nutrition.service';

@Controller('recipe-nutrition')
export class RecipeNutritionController {
  constructor(private readonly recipeNutritionService: RecipeNutritionService) {}
}
