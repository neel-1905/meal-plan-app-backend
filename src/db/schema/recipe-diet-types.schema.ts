import { pgTable, primaryKey, uuid } from 'drizzle-orm/pg-core';

import { recipes } from './recipes.schema.js';
import { dietTypes } from './diet-types.schema.js';

export const recipeDietTypes = pgTable(
  'recipe_diet_types',
  {
    recipeId: uuid('recipe_id')
      .notNull()
      .references(() => recipes.id, {
        onDelete: 'cascade',
      }),

    dietTypeId: uuid('diet_type_id')
      .notNull()
      .references(() => dietTypes.id, {
        onDelete: 'cascade',
      }),
  },
  (table) => [
    primaryKey({
      columns: [table.recipeId, table.dietTypeId],
    }),
  ],
);
