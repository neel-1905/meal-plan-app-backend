import { Body, Controller, Post } from '@nestjs/common';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';

import { ResponseMessage } from '../../common/http/decorators/response-message.decorator.js';

import { CreateRecipeDto } from './dto/create-recipe.dto.js';
import { RecipesService } from './recipes.service.js';

@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Post()
  @ResponseMessage('Recipe created successfully')
  createRecipe(@Session() session: UserSession, @Body() dto: CreateRecipeDto) {
    return this.recipesService.createRecipe(session.user.id, dto);
  }
}
