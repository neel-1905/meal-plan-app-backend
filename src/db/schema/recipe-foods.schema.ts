import { pgTable, primaryKey, uuid } from 'drizzle-orm/pg-core';

import { recipes } from './recipes.schema.js';
import { foods } from './foods.schema.js';

export const recipeFoods = pgTable(
  'recipe_foods',
  {
    recipeId: uuid('recipe_id')
      .notNull()
      .references(() => recipes.id, {
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
      columns: [table.recipeId, table.foodId],
    }),
  ],
);
