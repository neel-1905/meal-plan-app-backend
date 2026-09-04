import { Injectable } from '@nestjs/common';
import { db } from '../../lib/db.js';
import { dietTypes } from '../../db/schema/diet-types.schema.js';
import { asc } from 'drizzle-orm';

@Injectable()
export class DietTypesService {
  async getDietTypes() {
    return db.select().from(dietTypes).orderBy(asc(dietTypes.name));
  }
}
