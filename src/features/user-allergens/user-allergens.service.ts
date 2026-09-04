import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { db } from '../../lib/db.js';
import { allergens } from '../../db/schema/allergens.schema.js';
import { userAllergens } from '../../db/schema/user-allergens.js';
import { UpdateUserAllergensDto } from './dto/update-user-allergens.dto.js';

@Injectable()
export class UserAllergensService {
  async getUserAllergens(userId: string) {
    return db
      .select({
        id: allergens.id,
        name: allergens.name,
        description: allergens.description,
      })
      .from(userAllergens)
      .innerJoin(allergens, eq(userAllergens.allergenId, allergens.id))
      .where(eq(userAllergens.userId, userId));
  }

  async updateUserAllergens(userId: string, dto: UpdateUserAllergensDto) {
    return db.transaction(async (tx) => {
      await tx.delete(userAllergens).where(eq(userAllergens.userId, userId));

      if (dto.allergenIds.length > 0) {
        await tx.insert(userAllergens).values(
          dto.allergenIds.map((allergenId) => ({
            userId,
            allergenId,
          })),
        );
      }

      return tx
        .select({
          id: allergens.id,
          code: allergens.code,
          name: allergens.name,
          description: allergens.description,
        })
        .from(userAllergens)
        .innerJoin(allergens, eq(userAllergens.allergenId, allergens.id))
        .where(eq(userAllergens.userId, userId))
        .orderBy(allergens.name);
    });
  }
}
