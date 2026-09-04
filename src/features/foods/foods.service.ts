import { Injectable } from '@nestjs/common';
import { db } from '../../lib/db.js';
import { foods } from '../../db/schema/foods.schema.js';
import { asc, ilike } from 'drizzle-orm';

@Injectable()
export class FoodsService {
  async getFoods(search?: string) {
    return db
      .select({
        id: foods.id,
        code: foods.code,
        name: foods.name,
        description: foods.description,
      })
      .from(foods)
      .where(search ? ilike(foods.name, `%${search}%`) : undefined)
      .orderBy(asc(foods.name));
  }
}
