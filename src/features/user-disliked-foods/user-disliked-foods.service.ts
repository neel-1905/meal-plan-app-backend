import { Injectable } from '@nestjs/common';
import { db } from '../../lib/db.js';
import { foods } from '../../db/schema/foods.schema.js';
import { userDislikedFoods } from '../../db/schema/user-disliked-foods.schema.js';
import { eq } from 'drizzle-orm';
import { UpdateUserDislikedFoodsDto } from './dto/update-user-disliked-foods.dto.js';

@Injectable()
export class UserDislikedFoodsService {
  async getUserDislikedFoods(userId: string) {
    return db
      .select({
        id: foods.id,
        code: foods.code,
        name: foods.name,
        description: foods.description,
      })
      .from(userDislikedFoods)
      .innerJoin(foods, eq(userDislikedFoods.foodId, foods.id))
      .where(eq(userDislikedFoods.userId, userId))
      .orderBy(foods.name);
  }

  async updateUserDislikedFoods(
    userId: string,
    dto: UpdateUserDislikedFoodsDto,
  ) {
    return db.transaction(async (tx) => {
      await tx
        .delete(userDislikedFoods)
        .where(eq(userDislikedFoods.userId, userId));

      if (dto.foodIds.length > 0) {
        await tx.insert(userDislikedFoods).values(
          dto.foodIds.map((foodId) => ({
            userId,
            foodId,
          })),
        );
      }

      return tx
        .select({
          id: foods.id,
          code: foods.code,
          name: foods.name,
          description: foods.description,
        })
        .from(userDislikedFoods)
        .innerJoin(foods, eq(userDislikedFoods.foodId, foods.id))
        .where(eq(userDislikedFoods.userId, userId))
        .orderBy(foods.name);
    });
  }
}
