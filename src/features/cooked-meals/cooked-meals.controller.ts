import { Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';

import { Session, type UserSession } from '@thallesp/nestjs-better-auth';

import { ResponseMessage } from '../../common/http/decorators/response-message.decorator.js';

import { CookedMealsService } from './cooked-meals.service.js';
import { CookedMealQueryDto } from './dto/cooked-meal-query.dto.js';

@Controller('cooked-meals')
export class CookedMealsController {
  constructor(private readonly cookedMealsService: CookedMealsService) {}

  @Post('recipes/:recipeId')
  @ResponseMessage('Recipe marked as cooked successfully')
  cookRecipe(
    @Session() session: UserSession,
    @Param('recipeId') recipeId: string,
  ) {
    return this.cookedMealsService.cookRecipe(session.user.id, recipeId);
  }

  @Post('meal-plans/:mealPlanId')
  @ResponseMessage('Meal marked as cooked successfully')
  cookMealPlan(
    @Session() session: UserSession,
    @Param('mealPlanId') mealPlanId: string,
  ) {
    return this.cookedMealsService.cookMealPlan(session.user.id, mealPlanId);
  }

  @Get()
  @ResponseMessage('Cooked meals fetched successfully')
  getCookedMeals(
    @Session() session: UserSession,
    @Query() query: CookedMealQueryDto,
  ) {
    return this.cookedMealsService.getCookedMeals(session.user.id, query);
  }

  @Get(':id')
  @ResponseMessage('Cooked meal fetched successfully')
  getCookedMealById(
    @Session() session: UserSession,
    @Param('id') cookedMealId: string,
  ) {
    return this.cookedMealsService.getCookedMealById(
      session.user.id,
      cookedMealId,
    );
  }

  @Delete(':id')
  @ResponseMessage('Cooked meal deleted successfully')
  deleteCookedMeal(
    @Session() session: UserSession,
    @Param('id') cookedMealId: string,
  ) {
    return this.cookedMealsService.deleteCookedMeal(
      session.user.id,
      cookedMealId,
    );
  }
}
