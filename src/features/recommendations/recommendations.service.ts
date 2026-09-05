import { Injectable } from '@nestjs/common';
import { and, desc, eq, inArray, notInArray, sql } from 'drizzle-orm';

import { db } from '../../lib/db.js';
import {
  allergens,
  dietTypes,
  foods,
  recipeAllergens,
  recipeDietTypes,
  recipeFoods,
  recipes,
  userAllergens,
  userDietTypes,
  userDislikedFoods,
} from '../../db/schema/index.js';

@Injectable()
export class RecommendationsService {
  async getRecommendedRecipes(userId: string, limit = 10) {
    // 1. Get user's diet preferences
    const userDiets = await db
      .select({
        dietTypeId: userDietTypes.dietTypeId,
      })
      .from(userDietTypes)
      .where(eq(userDietTypes.userId, userId));

    const dietIds = userDiets.map((item) => item.dietTypeId);

    // 2. Get user's allergies
    const userAllergyRows = await db
      .select({
        allergenId: userAllergens.allergenId,
      })
      .from(userAllergens)
      .where(eq(userAllergens.userId, userId));

    const allergenIds = userAllergyRows.map((item) => item.allergenId);

    // 3. Get user's disliked foods
    const dislikedFoodRows = await db
      .select({
        foodId: userDislikedFoods.foodId,
      })
      .from(userDislikedFoods)
      .where(eq(userDislikedFoods.userId, userId));

    const dislikedFoodIds = dislikedFoodRows.map((item) => item.foodId);

    // 4. Build recommendation score
    const dietMatchScore =
      dietIds.length > 0
        ? sql<number>`
            CASE
              WHEN EXISTS (
                SELECT 1
                FROM ${recipeDietTypes}
                WHERE ${recipeDietTypes.recipeId} = ${recipes.id}
                AND ${recipeDietTypes.dietTypeId} IN (${sql.join(
                  dietIds.map((id) => sql`${id}`),
                  sql`, `,
                )})
              )
              THEN 10
              ELSE 0
            END
          `
        : sql<number>`0`;

    const score = sql<number>`
      ${dietMatchScore}
    `;

    // 5. Fetch recipes
    const recommendedRecipes = await db
      .select({
        id: recipes.id,
        name: recipes.name,
        description: recipes.description,
        image: recipes.image,
        cookingTime: recipes.cookingTime,
        servings: recipes.servings,
        createdAt: recipes.createdAt,
        score,
      })
      .from(recipes)
      .where(
        and(
          // Exclude recipes containing user's allergens
          allergenIds.length > 0
            ? notInArray(
                recipes.id,
                db
                  .select({
                    recipeId: recipeAllergens.recipeId,
                  })
                  .from(recipeAllergens)
                  .where(inArray(recipeAllergens.allergenId, allergenIds)),
              )
            : undefined,

          // Exclude recipes containing disliked foods
          dislikedFoodIds.length > 0
            ? notInArray(
                recipes.id,
                db
                  .select({
                    recipeId: recipeFoods.recipeId,
                  })
                  .from(recipeFoods)
                  .where(inArray(recipeFoods.foodId, dislikedFoodIds)),
              )
            : undefined,
        ),
      )
      .orderBy(desc(score), desc(recipes.createdAt))
      .limit(limit);

    return recommendedRecipes;
  }
}
