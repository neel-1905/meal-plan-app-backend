import { IsDateString, IsEnum, IsUUID } from 'class-validator';

export enum MealSlot {
  BREAKFAST = 'BREAKFAST',
  LUNCH = 'LUNCH',
  DINNER = 'DINNER',
  SNACK = 'SNACK',
}

export class CreateMealPlanDto {
  @IsUUID('4')
  recipeId: string;

  @IsDateString()
  date: string;

  @IsEnum(MealSlot)
  mealSlot: MealSlot;
}
