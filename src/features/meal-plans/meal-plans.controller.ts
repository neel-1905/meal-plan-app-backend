import { MealPlansService } from './meal-plans.service.js';
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
import { CreateMealPlanDto } from './dto/create-meal-plan.dto.js';
import { MealPlanQueryDto } from './dto/meal-plan-query.dto.js';
import { UpdateMealPlanDto } from './dto/update-meal-plan.dto.js';

@Controller('meal-plans')
export class MealPlansController {
  constructor(private readonly mealPlansService: MealPlansService) {}

  @Post()
  @ResponseMessage('Meal plan created successfully')
  createMealPlan(
    @Session() session: UserSession,
    @Body() dto: CreateMealPlanDto,
  ) {
    return this.mealPlansService.createMealPlan(session.user.id, dto);
  }

  @Get()
  @ResponseMessage('Meal plans fetched successfully')
  getMealPlans(
    @Session() session: UserSession,
    @Query() query: MealPlanQueryDto,
  ) {
    return this.mealPlansService.getMealPlans(session.user.id, query);
  }

  @Get(':id')
  @ResponseMessage('Meal plan fetched successfully')
  getMealPlanById(
    @Session() session: UserSession,
    @Param('id') mealPlanId: string,
  ) {
    return this.mealPlansService.getMealPlanById(session.user.id, mealPlanId);
  }

  @Patch(':id')
  @ResponseMessage('Meal plan updated successfully')
  updateMealPlan(
    @Session() session: UserSession,
    @Param('id') mealPlanId: string,
    @Body() dto: UpdateMealPlanDto,
  ) {
    return this.mealPlansService.updateMealPlan(
      session.user.id,
      mealPlanId,
      dto,
    );
  }

  @Delete(':id')
  @ResponseMessage('Meal plan deleted successfully')
  deleteMealPlan(
    @Session() session: UserSession,
    @Param('id') mealPlanId: string,
  ) {
    return this.mealPlansService.deleteMealPlan(session.user.id, mealPlanId);
  }
}
