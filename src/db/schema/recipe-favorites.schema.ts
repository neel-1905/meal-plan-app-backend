import {
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

import { user } from './user.schema.js';
import { recipes } from './recipes.schema.js';

export const recipeFavorites = pgTable(
  'recipe_favorites',
  {
    userId: text('user_id')
      .notNull()
      .references(() => user.id, {
        onDelete: 'cascade',
      }),

    recipeId: uuid('recipe_id')
      .notNull()
      .references(() => recipes.id, {
        onDelete: 'cascade',
      }),

    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    primaryKey({
      columns: [table.userId, table.recipeId],
    }),
  ],
);
