import { Controller, Delete, Get, Param, Post } from '@nestjs/common';

import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { RecipeFavoritesService } from './recipe-favorites.service.js';
import { ResponseMessage } from '../../common/http/decorators/response-message.decorator.js';

@Controller('recipe-favorites')
export class RecipeFavoritesController {
  constructor(
    private readonly recipeFavoritesService: RecipeFavoritesService,
  ) {}

  @Post(':id/favorite')
  @ResponseMessage('Recipe added to favorites successfully')
  addFavorite(@Session() session: UserSession, @Param('id') recipeId: string) {
    return this.recipeFavoritesService.addFavorite(session.user.id, recipeId);
  }

  @Delete(':id/favorite')
  @ResponseMessage('Recipe removed from favorites successfully')
  removeFavorite(
    @Session() session: UserSession,
    @Param('id') recipeId: string,
  ) {
    return this.recipeFavoritesService.removeFavorite(
      session.user.id,
      recipeId,
    );
  }

  @Get(':id/favorite')
  @ResponseMessage('Recipe favorite status fetched successfully')
  isFavorite(@Session() session: UserSession, @Param('id') recipeId: string) {
    return this.recipeFavoritesService.isFavorite(session.user.id, recipeId);
  }
}
