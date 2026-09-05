import { numeric, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';

import { recipes } from './recipes.schema.js';

export const recipeNutrition = pgTable('recipe_nutrition', {
  id: uuid('id').defaultRandom().primaryKey(),

  recipeId: uuid('recipe_id')
    .notNull()
    .unique()
    .references(() => recipes.id, { onDelete: 'cascade' }),

  calories: numeric('calories', {
    precision: 10,
    scale: 2,
  }),

  protein: numeric('protein', {
    precision: 10,
    scale: 2,
  }),

  carbohydrates: numeric('carbohydrates', {
    precision: 10,
    scale: 2,
  }),

  fat: numeric('fat', {
    precision: 10,
    scale: 2,
  }),

  fiber: numeric('fiber', {
    precision: 10,
    scale: 2,
  }),

  sugar: numeric('sugar', {
    precision: 10,
    scale: 2,
  }),

  sodium: numeric('sodium', {
    precision: 10,
    scale: 2,
  }),

  createdAt: timestamp('created_at').notNull().defaultNow(),

  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
