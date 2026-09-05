import { Module } from '@nestjs/common';
import { RecipeNutritionService } from './recipe-nutrition.service';
import { RecipeNutritionController } from './recipe-nutrition.controller';

@Module({
  controllers: [RecipeNutritionController],
  providers: [RecipeNutritionService],
})
export class RecipeNutritionModule {}
