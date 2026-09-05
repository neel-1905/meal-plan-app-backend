import { Module } from '@nestjs/common';
import { GroceryListService } from './grocery-list.service';
import { GroceryListController } from './grocery-list.controller';

@Module({
  controllers: [GroceryListController],
  providers: [GroceryListService],
})
export class GroceryListModule {}
