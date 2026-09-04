import { Module } from '@nestjs/common';
import { UserDislikedFoodsService } from './user-disliked-foods.service.js';
import { UserDislikedFoodsController } from './user-disliked-foods.controller.js';

@Module({
  controllers: [UserDislikedFoodsController],
  providers: [UserDislikedFoodsService],
  exports: [UserDislikedFoodsService],
})
export class UserDislikedFoodsModule {}
