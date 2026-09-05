import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { Session, type UserSession } from '@thallesp/nestjs-better-auth';

import { ResponseMessage } from '../../common/http/decorators/response-message.decorator.js';

import { CreateGroceryListDto } from './dto/create-grocery-list.dto.js';
import { UpdateGroceryListDto } from './dto/update-grocery-list.dto.js';
import { CreateGroceryItemDto } from './dto/create-grocery-item.dto.js';
import { UpdateGroceryItemDto } from './dto/update-grocery-item.dto.js';

import { GroceryListService } from './grocery-list.service.js';

@Controller('grocery-lists')
export class GroceryListsController {
  constructor(private readonly groceryListsService: GroceryListService) {}

  // =====================================================
  // LISTS
  // =====================================================

  @Post()
  @ResponseMessage('Grocery list created successfully')
  createList(
    @Session() session: UserSession,
    @Body() dto: CreateGroceryListDto,
  ) {
    return this.groceryListsService.createList(session.user.id, dto);
  }

  @Get()
  @ResponseMessage('Grocery lists fetched successfully')
  getLists(@Session() session: UserSession) {
    return this.groceryListsService.getLists(session.user.id);
  }

  @Get(':id')
  @ResponseMessage('Grocery list fetched successfully')
  getListById(@Session() session: UserSession, @Param('id') listId: string) {
    return this.groceryListsService.getListById(session.user.id, listId);
  }

  @Patch(':id')
  @ResponseMessage('Grocery list updated successfully')
  updateList(
    @Session() session: UserSession,
    @Param('id') listId: string,
    @Body() dto: UpdateGroceryListDto,
  ) {
    return this.groceryListsService.updateList(session.user.id, listId, dto);
  }

  @Delete(':id')
  @ResponseMessage('Grocery list deleted successfully')
  deleteList(@Session() session: UserSession, @Param('id') listId: string) {
    return this.groceryListsService.deleteList(session.user.id, listId);
  }

  // =====================================================
  // ITEMS
  // =====================================================

  @Post(':id/items')
  @ResponseMessage('Grocery item added successfully')
  addItem(
    @Session() session: UserSession,
    @Param('id') listId: string,
    @Body() dto: CreateGroceryItemDto,
  ) {
    return this.groceryListsService.addItem(session.user.id, listId, dto);
  }

  @Patch(':id/items/:itemId')
  @ResponseMessage('Grocery item updated successfully')
  updateItem(
    @Session() session: UserSession,
    @Param('id') listId: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateGroceryItemDto,
  ) {
    return this.groceryListsService.updateItem(
      session.user.id,
      listId,
      itemId,
      dto,
    );
  }

  @Delete(':id/items/:itemId')
  @ResponseMessage('Grocery item removed successfully')
  deleteItem(
    @Session() session: UserSession,
    @Param('id') listId: string,
    @Param('itemId') itemId: string,
  ) {
    return this.groceryListsService.deleteItem(session.user.id, listId, itemId);
  }

  // =====================================================
  // GENERATE
  // =====================================================

  @Post(':id/generate')
  @ResponseMessage('Grocery list generated successfully')
  generateFromMealPlan(
    @Session() session: UserSession,
    @Param('id') listId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.groceryListsService.generateFromMealPlan(
      session.user.id,
      listId,
      from,
      to,
    );
  }
}
