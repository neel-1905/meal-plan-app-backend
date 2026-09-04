import { Controller, Get, Query } from '@nestjs/common';
import { FoodsService } from './foods.service.js';
import { ResponseMessage } from '../../common/http/decorators/response-message.decorator.js';
import { FoodQueryDto } from './dto/food-query.dto.js';

@Controller('foods')
export class FoodsController {
  constructor(private readonly foodsService: FoodsService) {}

  @Get()
  @ResponseMessage('Foods fetched successfully')
  getFoods(@Query() query: FoodQueryDto) {
    return this.foodsService.getFoods(query.search);
  }
}
