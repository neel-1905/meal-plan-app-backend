import { pgTable, text, uuid, primaryKey } from 'drizzle-orm/pg-core';

import { user } from './user.schema.js';
import { foods } from './foods.schema.js';

export const userFoodPreferences = pgTable(
  'user_food_preferences',
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

    preference: text('preference').notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.userId, table.foodId],
    }),
  ],
);
