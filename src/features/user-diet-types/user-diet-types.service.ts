import { Injectable } from '@nestjs/common';
import { db } from '../../lib/db.js';
import { dietTypes } from '../../db/schema/diet-types.schema.js';
import { userDietTypes } from '../../db/schema/user-diet-types.schema.js';
import { eq } from 'drizzle-orm';
import { UpdateUserDietTypesDto } from './dto/update-user-diet-types.dto.js';

@Injectable()
export class UserDietTypesService {
  async getUserDietTypes(userId: string) {
    return db
      .select({
        id: dietTypes.id,
        name: dietTypes.name,
        description: dietTypes.description,
        code: dietTypes.code,
      })
      .from(userDietTypes)
      .innerJoin(dietTypes, eq(userDietTypes.dietTypeId, dietTypes.id))
      .where(eq(userDietTypes.userId, userId));
  }

  async updateUserDietTypes(userId: string, dto: UpdateUserDietTypesDto) {
    return db.transaction(async (tx) => {
      await tx.delete(userDietTypes).where(eq(userDietTypes.userId, userId));

      if (dto.dietTypeIds.length > 0) {
        await tx.insert(userDietTypes).values(
          dto.dietTypeIds.map((dietTypeId) => ({
            userId,
            dietTypeId,
          })),
        );
      }

      return tx
        .select({
          id: dietTypes.id,
          code: dietTypes.code,
          name: dietTypes.name,
          description: dietTypes.description,
        })
        .from(userDietTypes)
        .innerJoin(dietTypes, eq(userDietTypes.dietTypeId, dietTypes.id))
        .where(eq(userDietTypes.userId, userId))
        .orderBy(dietTypes.name);
    });
  }
}
