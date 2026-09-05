import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { and, desc, eq } from 'drizzle-orm';

import { db } from '../../lib/db.js';

import { recipeFavorites, recipes } from '../../db/schema/index.js';

@Injectable()
export class RecipeFavoritesService {
  // ======================================================
  // ADD FAVORITE
  // ======================================================

  async addFavorite(userId: string, recipeId: string) {
    // --------------------------------------------------
    // Check recipe exists
    // --------------------------------------------------

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

    // --------------------------------------------------
    // Check if already favorited
    // --------------------------------------------------

    const [existingFavorite] = await db
      .select({
        userId: recipeFavorites.userId,
        recipeId: recipeFavorites.recipeId,
      })
      .from(recipeFavorites)
      .where(
        and(
          eq(recipeFavorites.userId, userId),
          eq(recipeFavorites.recipeId, recipeId),
        ),
      )
      .limit(1);

    if (existingFavorite) {
      throw new ConflictException('Recipe is already in favorites');
    }

    // --------------------------------------------------
    // Create favorite
    // --------------------------------------------------

    const [favorite] = await db
      .insert(recipeFavorites)
      .values({
        userId,
        recipeId,
      })
      .returning();

    return favorite;
  }

  // ======================================================
  // REMOVE FAVORITE
  // ======================================================

  async removeFavorite(userId: string, recipeId: string) {
    const [favorite] = await db
      .select({
        userId: recipeFavorites.userId,
        recipeId: recipeFavorites.recipeId,
      })
      .from(recipeFavorites)
      .where(
        and(
          eq(recipeFavorites.userId, userId),
          eq(recipeFavorites.recipeId, recipeId),
        ),
      )
      .limit(1);

    if (!favorite) {
      throw new NotFoundException('Recipe is not in your favorites');
    }

    await db
      .delete(recipeFavorites)
      .where(
        and(
          eq(recipeFavorites.userId, userId),
          eq(recipeFavorites.recipeId, recipeId),
        ),
      );

    return null;
  }

  // ======================================================
  // GET USER FAVORITES
  // ======================================================

  async getFavorites(userId: string) {
    return db
      .select({
        id: recipes.id,
        name: recipes.name,
        description: recipes.description,
        image: recipes.image,
        cookingTime: recipes.cookingTime,
        servings: recipes.servings,
        createdBy: recipes.createdBy,
        favoritedAt: recipeFavorites.createdAt,
      })
      .from(recipeFavorites)
      .innerJoin(recipes, eq(recipeFavorites.recipeId, recipes.id))
      .where(eq(recipeFavorites.userId, userId))
      .orderBy(desc(recipeFavorites.createdAt));
  }

  // ======================================================
  // CHECK FAVORITE
  // ======================================================

  async isFavorite(userId: string, recipeId: string) {
    const [favorite] = await db
      .select({
        recipeId: recipeFavorites.recipeId,
      })
      .from(recipeFavorites)
      .where(
        and(
          eq(recipeFavorites.userId, userId),
          eq(recipeFavorites.recipeId, recipeId),
        ),
      )
      .limit(1);

    return {
      isFavorite: !!favorite,
    };
  }
}
