import { pgTable, primaryKey, timestamp, uuid } from 'drizzle-orm/pg-core';

import { collections } from './collections.schema.js';
import { recipes } from './recipes.schema.js';

export const collectionRecipes = pgTable(
  'collection_recipes',
  {
    collectionId: uuid('collection_id')
      .notNull()
      .references(() => collections.id, {
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
      columns: [table.collectionId, table.recipeId],
    }),
  ],
);
