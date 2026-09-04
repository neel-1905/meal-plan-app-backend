import { pgTable, primaryKey, text, uuid } from 'drizzle-orm/pg-core';

import { user } from './user.schema.js';
import { foods } from './foods.schema.js';

export const userDislikedFoods = pgTable(
  'user_disliked_foods',
  {
    userId: text('user_id')
      .notNull()
      .references(() => user.id, {
        onDelete: 'cascade',
      }),

    foodId: uuid('food_id')
      .notNull()
      .references(() => foods.id, {
        onDelete: 'cascade',
      }),
  },
  (table) => [
    primaryKey({
      columns: [table.userId, table.foodId],
    }),
  ],
);
