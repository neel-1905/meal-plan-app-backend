import { Injectable } from '@nestjs/common';
import { db } from '../../lib/db.js';
import { allergens } from '../../db/schema/allergens.schema.js';
import { asc } from 'drizzle-orm';

@Injectable()
export class AllergensService {
  async getAllergens() {
    return db
      .select({
        id: allergens.id,
        code: allergens.code,
        name: allergens.name,
        description: allergens.description,
      })
      .from(allergens)
      .orderBy(asc(allergens.name));
  }
}
