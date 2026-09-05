import { Module } from '@nestjs/common';
import { GroceryListService } from './grocery-list.service.js';
import { GroceryListController } from './grocery-list.controller.js';

@Module({
  controllers: [GroceryListController],
  providers: [GroceryListService],
})
export class GroceryListModule {}
