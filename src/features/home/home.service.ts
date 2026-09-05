import { Injectable } from '@nestjs/common';
import { count, desc, eq, sql, and } from 'drizzle-orm';

import { db } from '../../lib/db.js';

import { mealPlans, recipeFavorites, recipes } from '../../db/schema/index.js';

@Injectable()
export class HomeService {
  async getHome(userId: string) {
    const today = new Date().toISOString().split('T')[0];

    // --------------------------------------------------
    // Today's meals
    // --------------------------------------------------

    const todayMeals = await db
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
      })
      .from(mealPlans)
      .innerJoin(recipes, eq(mealPlans.recipeId, recipes.id))
      .where(and(eq(mealPlans.userId, userId), eq(mealPlans.date, today)))
      .orderBy(
        sql`
          CASE
            WHEN ${mealPlans.mealSlot} = 'BREAKFAST' THEN 1
            WHEN ${mealPlans.mealSlot} = 'LUNCH' THEN 2
            WHEN ${mealPlans.mealSlot} = 'DINNER' THEN 3
            WHEN ${mealPlans.mealSlot} = 'SNACK' THEN 4
            ELSE 5
          END ASC
        `,
      );

    // --------------------------------------------------
    // Most popular
    // --------------------------------------------------

    const mostPopular = await db
      .select({
        id: recipes.id,
        name: recipes.name,
        image: recipes.image,
        cookingTime: recipes.cookingTime,
        servings: recipes.servings,

        favoriteCount: count(recipeFavorites.recipeId),
      })
      .from(recipes)
      .leftJoin(recipeFavorites, eq(recipes.id, recipeFavorites.recipeId))
      .groupBy(recipes.id)
      .orderBy(desc(count(recipeFavorites.recipeId)), desc(recipes.createdAt))
      .limit(10);

    // --------------------------------------------------
    // Recently added
    // --------------------------------------------------

    const recentlyAdded = await db
      .select({
        id: recipes.id,
        name: recipes.name,
        image: recipes.image,
        cookingTime: recipes.cookingTime,
        servings: recipes.servings,
        createdAt: recipes.createdAt,
      })
      .from(recipes)
      .orderBy(desc(recipes.createdAt))
      .limit(10);

    // --------------------------------------------------
    // Recommended
    // --------------------------------------------------

    const recommended = await this.getRecommendedRecipes(userId);

    return {
      today: {
        date: today,
        meals: todayMeals,
      },

      mostPopular,

      recentlyAdded,

      recommended,
    };
  }

  // ======================================================
  // RECOMMENDED
  // ======================================================

  private async getRecommendedRecipes(userId: string) {
    /*
     * Recommendation logic will be expanded later.
     *
     * For now, return recently added recipes.
     */

    return db
      .select({
        id: recipes.id,
        name: recipes.name,
        image: recipes.image,
        cookingTime: recipes.cookingTime,
        servings: recipes.servings,
      })
      .from(recipes)
      .orderBy(desc(recipes.createdAt))
      .limit(10);
  }
}
