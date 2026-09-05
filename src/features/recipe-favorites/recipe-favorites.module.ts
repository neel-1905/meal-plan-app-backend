import { Module } from '@nestjs/common';
import { RecipeFavoritesService } from './recipe-favorites.service.js';
import { RecipeFavoritesController } from './recipe-favorites.controller.js';
import { RecipeFavoritesListController } from './recipe-favorites-list.controller.js';

@Module({
  controllers: [RecipeFavoritesController, RecipeFavoritesListController],
  providers: [RecipeFavoritesService],
  exports: [RecipeFavoritesService],
})
export class RecipeFavoritesModule {}
