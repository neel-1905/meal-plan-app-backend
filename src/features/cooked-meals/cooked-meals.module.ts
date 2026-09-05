import { Module } from '@nestjs/common';
import { CookedMealsService } from './cooked-meals.service.js';
import { CookedMealsController } from './cooked-meals.controller.js';

@Module({
  controllers: [CookedMealsController],
  providers: [CookedMealsService],
})
export class CookedMealsModule {}
