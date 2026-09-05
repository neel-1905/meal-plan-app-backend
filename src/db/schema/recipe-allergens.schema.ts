import { pgTable, primaryKey, uuid } from 'drizzle-orm/pg-core';

import { recipes } from './recipes.schema.js';
import { allergens } from './allergens.schema.js';

export const recipeAllergens = pgTable(
  'recipe_allergens',
  {
    recipeId: uuid('recipe_id')
      .notNull()
      .references(() => recipes.id, {
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
      columns: [table.recipeId, table.allergenId],
    }),
  ],
);
