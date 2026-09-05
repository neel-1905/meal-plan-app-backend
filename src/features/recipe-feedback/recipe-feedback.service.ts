import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { and, count, desc, eq, sql } from 'drizzle-orm';

import { db } from '../../lib/db.js';
import { cookedMeals, recipeFeedback, recipes } from '../../db/schema/index.js';

import { CreateRecipeFeedbackDto } from './dto/create-recipe-feedback.dto.js';
import { UpdateRecipeFeedbackDto } from './dto/update-recipe-feedback.dto.js';

@Injectable()
export class RecipeFeedbackService {
  /**
   * Create feedback for a recipe.
   */
  async createFeedback(
    userId: string,
    recipeId: string,
    dto: CreateRecipeFeedbackDto,
  ) {
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

    // User should have cooked the recipe
    const [cookedMeal] = await db
      .select({
        id: cookedMeals.id,
      })
      .from(cookedMeals)
      .where(
        and(eq(cookedMeals.userId, userId), eq(cookedMeals.recipeId, recipeId)),
      )
      .limit(1);

    if (!cookedMeal) {
      throw new ConflictException(
        'You can only review a recipe after cooking it',
      );
    }

    // Check duplicate feedback
    const [existingFeedback] = await db
      .select({
        id: recipeFeedback.id,
      })
      .from(recipeFeedback)
      .where(
        and(
          eq(recipeFeedback.userId, userId),
          eq(recipeFeedback.recipeId, recipeId),
        ),
      )
      .limit(1);

    if (existingFeedback) {
      throw new ConflictException(
        'You have already submitted feedback for this recipe',
      );
    }

    const [feedback] = await db
      .insert(recipeFeedback)
      .values({
        userId,
        recipeId,
        rating: dto.rating,
        comment: dto.comment,
      })
      .returning();

    return feedback;
  }

  /**
   * Get all feedback for a recipe.
   */
  async getRecipeFeedback(recipeId: string) {
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

    return db
      .select({
        id: recipeFeedback.id,
        userId: recipeFeedback.userId,
        rating: recipeFeedback.rating,
        comment: recipeFeedback.comment,
        createdAt: recipeFeedback.createdAt,
        updatedAt: recipeFeedback.updatedAt,
      })
      .from(recipeFeedback)
      .where(eq(recipeFeedback.recipeId, recipeId))
      .orderBy(desc(recipeFeedback.createdAt));
  }

  /**
   * Get the current user's feedback for a recipe.
   */
  async getMyFeedback(userId: string, recipeId: string) {
    const [feedback] = await db
      .select({
        id: recipeFeedback.id,
        recipeId: recipeFeedback.recipeId,
        rating: recipeFeedback.rating,
        comment: recipeFeedback.comment,
        createdAt: recipeFeedback.createdAt,
        updatedAt: recipeFeedback.updatedAt,
      })
      .from(recipeFeedback)
      .where(
        and(
          eq(recipeFeedback.userId, userId),
          eq(recipeFeedback.recipeId, recipeId),
        ),
      )
      .limit(1);

    if (!feedback) {
      throw new NotFoundException(
        'You have not submitted feedback for this recipe',
      );
    }

    return feedback;
  }

  /**
   * Update current user's feedback.
   */
  async updateFeedback(
    userId: string,
    recipeId: string,
    dto: UpdateRecipeFeedbackDto,
  ) {
    const [existingFeedback] = await db
      .select({
        id: recipeFeedback.id,
      })
      .from(recipeFeedback)
      .where(
        and(
          eq(recipeFeedback.userId, userId),
          eq(recipeFeedback.recipeId, recipeId),
        ),
      )
      .limit(1);

    if (!existingFeedback) {
      throw new NotFoundException(
        'You have not submitted feedback for this recipe',
      );
    }

    const [updatedFeedback] = await db
      .update(recipeFeedback)
      .set({
        ...(dto.rating !== undefined && {
          rating: dto.rating,
        }),
        ...(dto.comment !== undefined && {
          comment: dto.comment,
        }),
        updatedAt: new Date(),
      })
      .where(eq(recipeFeedback.id, existingFeedback.id))
      .returning();

    return updatedFeedback;
  }

  /**
   * Delete current user's feedback.
   */
  async deleteFeedback(userId: string, recipeId: string) {
    const [existingFeedback] = await db
      .select({
        id: recipeFeedback.id,
      })
      .from(recipeFeedback)
      .where(
        and(
          eq(recipeFeedback.userId, userId),
          eq(recipeFeedback.recipeId, recipeId),
        ),
      )
      .limit(1);

    if (!existingFeedback) {
      throw new NotFoundException(
        'You have not submitted feedback for this recipe',
      );
    }

    await db
      .delete(recipeFeedback)
      .where(eq(recipeFeedback.id, existingFeedback.id));

    return null;
  }

  /**
   * Get rating summary for a recipe.
   */
  async getRecipeFeedbackSummary(recipeId: string) {
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

    const [summary] = await db
      .select({
        totalReviews: count(recipeFeedback.id),

        averageRating: sql<number | null>`
          ROUND(AVG(${recipeFeedback.rating})::numeric, 1)
        `,

        fiveStars: sql<number>`
          COUNT(*) FILTER (
            WHERE ${recipeFeedback.rating} = 5
          )
        `,

        fourStars: sql<number>`
          COUNT(*) FILTER (
            WHERE ${recipeFeedback.rating} = 4
          )
        `,

        threeStars: sql<number>`
          COUNT(*) FILTER (
            WHERE ${recipeFeedback.rating} = 3
          )
        `,

        twoStars: sql<number>`
          COUNT(*) FILTER (
            WHERE ${recipeFeedback.rating} = 2
          )
        `,

        oneStar: sql<number>`
          COUNT(*) FILTER (
            WHERE ${recipeFeedback.rating} = 1
          )
        `,
      })
      .from(recipeFeedback)
      .where(eq(recipeFeedback.recipeId, recipeId));

    return {
      totalReviews: Number(summary.totalReviews),
      averageRating:
        summary.averageRating !== null ? Number(summary.averageRating) : null,
      ratingBreakdown: {
        5: Number(summary.fiveStars),
        4: Number(summary.fourStars),
        3: Number(summary.threeStars),
        2: Number(summary.twoStars),
        1: Number(summary.oneStar),
      },
    };
  }
}
