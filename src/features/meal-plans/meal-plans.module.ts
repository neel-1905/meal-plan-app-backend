import { Module } from '@nestjs/common';
import { MealPlansService } from './meal-plans.service.js';
import { MealPlansController } from './meal-plans.controller.js';

@Module({
  controllers: [MealPlansController],
  providers: [MealPlansService],
  exports: [MealPlansService],
})
export class MealPlansModule {}
