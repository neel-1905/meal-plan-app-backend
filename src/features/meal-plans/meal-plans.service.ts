import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { and, asc, eq, gte, lte } from 'drizzle-orm';

import { db } from '../../lib/db.js';

import { mealPlans, recipes } from '../../db/schema/index.js';

import { CreateMealPlanDto } from './dto/create-meal-plan.dto.js';
import { UpdateMealPlanDto } from './dto/update-meal-plan.dto.js';
import { MealPlanQueryDto } from './dto/meal-plan-query.dto.js';

@Injectable()
export class MealPlansService {
  async createMealPlan(userId: string, dto: CreateMealPlanDto) {
    // --------------------------------------------------
    // Check recipe exists
    // --------------------------------------------------

    const [recipe] = await db
      .select({
        id: recipes.id,
      })
      .from(recipes)
      .where(eq(recipes.id, dto.recipeId))
      .limit(1);

    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    // --------------------------------------------------
    // Prevent duplicate slot
    // --------------------------------------------------

    const [existingMealPlan] = await db
      .select({
        id: mealPlans.id,
      })
      .from(mealPlans)
      .where(
        and(
          eq(mealPlans.userId, userId),
          eq(mealPlans.date, dto.date),
          eq(mealPlans.mealSlot, dto.mealSlot),
        ),
      )
      .limit(1);

    if (existingMealPlan) {
      throw new BadRequestException(
        'A meal is already planned for this date and meal slot',
      );
    }

    // --------------------------------------------------
    // Create
    // --------------------------------------------------

    const [mealPlan] = await db
      .insert(mealPlans)
      .values({
        userId,
        recipeId: dto.recipeId,
        date: dto.date,
        mealSlot: dto.mealSlot,
      })
      .returning();

    return mealPlan;
  }

  // ======================================================
  // GET ALL
  // ======================================================

  async getMealPlans(userId: string, query: MealPlanQueryDto) {
    const conditions = [eq(mealPlans.userId, userId)];

    if (query.from) {
      conditions.push(gte(mealPlans.date, query.from));
    }

    if (query.to) {
      conditions.push(lte(mealPlans.date, query.to));
    }

    return db
      .select({
        id: mealPlans.id,

        date: mealPlans.date,

        mealSlot: mealPlans.mealSlot,

        recipe: {
          id: recipes.id,
          name: recipes.name,
          image: recipes.image,
          cookingTime: recipes.cookingTime,
          servings: recipes.servings,
        },

        createdAt: mealPlans.createdAt,
        updatedAt: mealPlans.updatedAt,
      })
      .from(mealPlans)
      .innerJoin(recipes, eq(mealPlans.recipeId, recipes.id))
      .where(and(...conditions))
      .orderBy(asc(mealPlans.date), asc(mealPlans.mealSlot));
  }

  // ======================================================
  // GET ONE
  // ======================================================

  async getMealPlanById(userId: string, mealPlanId: string) {
    const [mealPlan] = await db
      .select({
        id: mealPlans.id,

        userId: mealPlans.userId,

        date: mealPlans.date,

        mealSlot: mealPlans.mealSlot,

        recipe: {
          id: recipes.id,
          name: recipes.name,
          description: recipes.description,
          image: recipes.image,
          cookingTime: recipes.cookingTime,
          servings: recipes.servings,
        },

        createdAt: mealPlans.createdAt,
        updatedAt: mealPlans.updatedAt,
      })
      .from(mealPlans)
      .innerJoin(recipes, eq(mealPlans.recipeId, recipes.id))
      .where(and(eq(mealPlans.id, mealPlanId), eq(mealPlans.userId, userId)))
      .limit(1);

    if (!mealPlan) {
      throw new NotFoundException('Meal plan not found');
    }

    return mealPlan;
  }

  async updateMealPlan(
    userId: string,
    mealPlanId: string,
    dto: UpdateMealPlanDto,
  ) {
    // --------------------------------------------------
    // Find existing meal plan
    // --------------------------------------------------

    const [existingMealPlan] = await db
      .select({
        id: mealPlans.id,
        userId: mealPlans.userId,
        recipeId: mealPlans.recipeId,
        date: mealPlans.date,
        mealSlot: mealPlans.mealSlot,
      })
      .from(mealPlans)
      .where(eq(mealPlans.id, mealPlanId))
      .limit(1);

    if (!existingMealPlan) {
      throw new NotFoundException('Meal plan not found');
    }

    // --------------------------------------------------
    // Ownership
    // --------------------------------------------------

    if (existingMealPlan.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this meal plan',
      );
    }

    // --------------------------------------------------
    // Recipe validation
    // --------------------------------------------------

    if (dto.recipeId !== undefined) {
      const [recipe] = await db
        .select({
          id: recipes.id,
        })
        .from(recipes)
        .where(eq(recipes.id, dto.recipeId))
        .limit(1);

      if (!recipe) {
        throw new NotFoundException('Recipe not found');
      }
    }

    // --------------------------------------------------
    // Calculate final values
    // --------------------------------------------------

    const newDate = dto.date ?? existingMealPlan.date;

    const newMealSlot = dto.mealSlot ?? existingMealPlan.mealSlot;

    const newRecipeId = dto.recipeId ?? existingMealPlan.recipeId;

    // --------------------------------------------------
    // Check duplicate slot
    // --------------------------------------------------

    const [duplicate] = await db
      .select({
        id: mealPlans.id,
      })
      .from(mealPlans)
      .where(
        and(
          eq(mealPlans.userId, userId),
          eq(mealPlans.date, newDate),
          eq(mealPlans.mealSlot, newMealSlot),
        ),
      )
      .limit(1);

    if (duplicate && duplicate.id !== mealPlanId) {
      throw new BadRequestException(
        'A meal is already planned for this date and meal slot',
      );
    }

    // --------------------------------------------------
    // Update
    // --------------------------------------------------

    const [updatedMealPlan] = await db
      .update(mealPlans)
      .set({
        recipeId: newRecipeId,
        date: newDate,
        mealSlot: newMealSlot,
        updatedAt: new Date(),
      })
      .where(and(eq(mealPlans.id, mealPlanId), eq(mealPlans.userId, userId)))
      .returning();

    return updatedMealPlan;
  }

  // ======================================================
  // DELETE
  // ======================================================

  async deleteMealPlan(userId: string, mealPlanId: string) {
    const [existingMealPlan] = await db
      .select({
        id: mealPlans.id,
        userId: mealPlans.userId,
      })
      .from(mealPlans)
      .where(eq(mealPlans.id, mealPlanId))
      .limit(1);

    if (!existingMealPlan) {
      throw new NotFoundException('Meal plan not found');
    }

    if (existingMealPlan.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this meal plan',
      );
    }

    await db.delete(mealPlans).where(eq(mealPlans.id, mealPlanId));

    return null;
  }
}
