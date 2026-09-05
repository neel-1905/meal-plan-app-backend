import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';

import { ResponseMessage } from '../../common/http/decorators/response-message.decorator.js';

import { CreateRecipeDto } from './dto/create-recipe.dto.js';
import { RecipesService } from './recipes.service.js';
import { RecipeQueryDto } from './dto/recipe-query.dto.js';

@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Post()
  @ResponseMessage('Recipe created successfully')
  createRecipe(@Session() session: UserSession, @Body() dto: CreateRecipeDto) {
    return this.recipesService.createRecipe(session.user.id, dto);
  }

  @Get()
  @ResponseMessage('Recipes fetched successfully')
  getRecipes(@Query() query: RecipeQueryDto) {
    return this.recipesService.getRecipes(query);
  }

  @Get(':id')
  @ResponseMessage('Recipe fetched successfully')
  getRecipeById(@Param('id') recipeId: string) {
    return this.recipesService.getRecipeById(recipeId);
  }
}
