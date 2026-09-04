import { Module } from '@nestjs/common';
import { FoodsService } from './foods.service.js';
import { FoodsController } from './foods.controller.js';

@Module({
  controllers: [FoodsController],
  providers: [FoodsService],
  exports: [FoodsService],
})
export class FoodsModule {}
