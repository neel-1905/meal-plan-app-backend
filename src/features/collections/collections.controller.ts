import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { Session, type UserSession } from '@thallesp/nestjs-better-auth';

import { ResponseMessage } from '../../common/http/decorators/response-message.decorator.js';

import { CreateCollectionDto } from './dto/create-collection.dto.js';
import { UpdateCollectionDto } from './dto/update-collection.dto.js';

import { CollectionsService } from './collections.service.js';

@Controller('collections')
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Post()
  @ResponseMessage('Collection created successfully')
  createCollection(
    @Session() session: UserSession,
    @Body() dto: CreateCollectionDto,
  ) {
    return this.collectionsService.createCollection(session.user.id, dto);
  }

  @Get()
  @ResponseMessage('Collections fetched successfully')
  getCollections(@Session() session: UserSession) {
    return this.collectionsService.getCollections(session.user.id);
  }

  @Get(':id')
  @ResponseMessage('Collection fetched successfully')
  getCollectionById(
    @Session() session: UserSession,
    @Param('id') collectionId: string,
  ) {
    return this.collectionsService.getCollectionById(
      session.user.id,
      collectionId,
    );
  }

  @Patch(':id')
  @ResponseMessage('Collection updated successfully')
  updateCollection(
    @Session() session: UserSession,
    @Param('id') collectionId: string,
    @Body() dto: UpdateCollectionDto,
  ) {
    return this.collectionsService.updateCollection(
      session.user.id,
      collectionId,
      dto,
    );
  }

  @Delete(':id')
  @ResponseMessage('Collection deleted successfully')
  deleteCollection(
    @Session() session: UserSession,
    @Param('id') collectionId: string,
  ) {
    return this.collectionsService.deleteCollection(
      session.user.id,
      collectionId,
    );
  }

  @Post(':id/recipes/:recipeId')
  @ResponseMessage('Recipe added to collection successfully')
  addRecipe(
    @Session() session: UserSession,
    @Param('id') collectionId: string,
    @Param('recipeId') recipeId: string,
  ) {
    return this.collectionsService.addRecipe(
      session.user.id,
      collectionId,
      recipeId,
    );
  }

  @Delete(':id/recipes/:recipeId')
  @ResponseMessage('Recipe removed from collection successfully')
  removeRecipe(
    @Session() session: UserSession,
    @Param('id') collectionId: string,
    @Param('recipeId') recipeId: string,
  ) {
    return this.collectionsService.removeRecipe(
      session.user.id,
      collectionId,
      recipeId,
    );
  }
}
