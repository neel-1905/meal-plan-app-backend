import { pgTable, text, uuid, primaryKey } from 'drizzle-orm/pg-core';

import { user } from './user.schema.js';
import { allergens } from './allergens.schema.js';

export const userAllergens = pgTable(
  'user_allergens',
  {
    userId: text('user_id')
      .notNull()
      .references(() => user.id, {
        onDelete: 'cascade',
      }),

    allergenId: uuid('allergen_id')
      .notNull()
      .references(() => allergens.id, {
        onDelete: 'cascade',
      }),
  },
  (table) => [
    primaryKey({
      columns: [table.userId, table.allergenId],
    }),
  ],
);
