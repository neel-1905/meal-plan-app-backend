import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { and, asc, desc, eq, gte, lte } from 'drizzle-orm';

import { db } from '../../lib/db.js';

import { cookedMeals, mealPlans, recipes } from '../../db/schema/index.js';

import { CookedMealQueryDto } from './dto/cooked-meal-query.dto.js';

@Injectable()
export class CookedMealsService {
  async cookRecipe(userId: string, recipeId: string, mealPlanId?: string) {
    // Check recipe exists
    const [recipe] = await db
      .select({
        id: recipes.id,
      })
      .from(recipes)
      .where(eq(recipes.id, recipeId))
      .limit(1);

    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    // If a meal plan was provided, make sure it belongs to this user
    if (mealPlanId) {
      const [mealPlan] = await db
        .select({
          id: mealPlans.id,
          userId: mealPlans.userId,
          recipeId: mealPlans.recipeId,
        })
        .from(mealPlans)
        .where(eq(mealPlans.id, mealPlanId))
        .limit(1);

      if (!mealPlan) {
        throw new NotFoundException('Meal plan not found');
      }

      if (mealPlan.userId !== userId) {
        throw new ForbiddenException(
          'You do not have access to this meal plan',
        );
      }

      if (mealPlan.recipeId !== recipeId) {
        throw new ConflictException('Meal plan does not belong to this recipe');
      }
    }

    const [cookedMeal] = await db
      .insert(cookedMeals)
      .values({
        userId,
        recipeId,
        mealPlanId,
      })
      .returning();

    return cookedMeal;
  }

  async getCookedMeals(userId: string, query: CookedMealQueryDto) {
    const conditions = [eq(cookedMeals.userId, userId)];

    if (query.from) {
      conditions.push(gte(cookedMeals.cookedAt, new Date(query.from)));
    }

    if (query.to) {
      const to = new Date(query.to);
      to.setHours(23, 59, 59, 999);

      conditions.push(lte(cookedMeals.cookedAt, to));
    }

    return db
      .select({
        id: cookedMeals.id,

        cookedAt: cookedMeals.cookedAt,

        recipe: {
          id: recipes.id,
          name: recipes.name,
          image: recipes.image,
          cookingTime: recipes.cookingTime,
          servings: recipes.servings,
        },

        mealPlanId: cookedMeals.mealPlanId,
      })
      .from(cookedMeals)
      .innerJoin(recipes, eq(cookedMeals.recipeId, recipes.id))
      .where(and(...conditions))
      .orderBy(desc(cookedMeals.cookedAt));
  }

  async getCookedMealById(userId: string, cookedMealId: string) {
    const [cookedMeal] = await db
      .select({
        id: cookedMeals.id,

        cookedAt: cookedMeals.cookedAt,

        mealPlanId: cookedMeals.mealPlanId,

        recipe: {
          id: recipes.id,
          name: recipes.name,
          description: recipes.description,
          image: recipes.image,
          cookingTime: recipes.cookingTime,
          servings: recipes.servings,
        },
      })
      .from(cookedMeals)
      .innerJoin(recipes, eq(cookedMeals.recipeId, recipes.id))
      .where(
        and(eq(cookedMeals.id, cookedMealId), eq(cookedMeals.userId, userId)),
      )
      .limit(1);

    if (!cookedMeal) {
      throw new NotFoundException('Cooked meal not found');
    }

    return cookedMeal;
  }

  async deleteCookedMeal(userId: string, cookedMealId: string) {
    const [cookedMeal] = await db
      .select({
        id: cookedMeals.id,
        userId: cookedMeals.userId,
      })
      .from(cookedMeals)
      .where(eq(cookedMeals.id, cookedMealId))
      .limit(1);

    if (!cookedMeal) {
      throw new NotFoundException('Cooked meal not found');
    }

    if (cookedMeal.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this cooked meal',
      );
    }

    await db.delete(cookedMeals).where(eq(cookedMeals.id, cookedMealId));

    return null;
  }

  async cookMealPlan(userId: string, mealPlanId: string) {
    const [mealPlan] = await db
      .select({
        id: mealPlans.id,
        userId: mealPlans.userId,
        recipeId: mealPlans.recipeId,
      })
      .from(mealPlans)
      .where(eq(mealPlans.id, mealPlanId))
      .limit(1);

    if (!mealPlan) {
      throw new NotFoundException('Meal plan not found');
    }

    if (mealPlan.userId !== userId) {
      throw new ForbiddenException('You do not have access to this meal plan');
    }

    const [cookedMeal] = await db
      .insert(cookedMeals)
      .values({
        userId,
        recipeId: mealPlan.recipeId,
        mealPlanId: mealPlan.id,
      })
      .returning();

    return cookedMeal;
  }
}
