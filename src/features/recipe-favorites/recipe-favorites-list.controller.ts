import { Controller, Get } from '@nestjs/common';

import { Session, type UserSession } from '@thallesp/nestjs-better-auth';

import { ResponseMessage } from '../../common/http/decorators/response-message.decorator.js';

import { RecipeFavoritesService } from './recipe-favorites.service.js';

@Controller('favorites')
export class RecipeFavoritesListController {
  constructor(
    private readonly recipeFavoritesService: RecipeFavoritesService,
  ) {}

  @Get('recipes')
  @ResponseMessage('Favorite recipes fetched successfully')
  getFavorites(@Session() session: UserSession) {
    return this.recipeFavoritesService.getFavorites(session.user.id);
  }
}
