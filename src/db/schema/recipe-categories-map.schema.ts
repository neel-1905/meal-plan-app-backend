import { pgTable, primaryKey, uuid } from 'drizzle-orm/pg-core';

import { recipes } from './recipes.schema.js';
import { recipeCategories } from './recipe-categories.schema.js';

export const recipeCategoriesMap = pgTable(
  'recipe_categories_map',
  {
    recipeId: uuid('recipe_id')
      .notNull()
      .references(() => recipes.id, {
        onDelete: 'cascade',
      }),

    categoryId: uuid('category_id')
      .notNull()
      .references(() => recipeCategories.id, {
        onDelete: 'cascade',
      }),
  },

  (table) => [
    primaryKey({
      columns: [table.recipeId, table.categoryId],
    }),
  ],
);
