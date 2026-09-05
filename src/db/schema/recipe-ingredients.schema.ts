import {
  boolean,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

import { ingredients } from './ingredients.schema.js';
import { recipes } from './recipes.schema.js';

export const recipeIngredients = pgTable('recipe_ingredients', {
  id: uuid('id').defaultRandom().primaryKey(),

  recipeId: uuid('recipe_id')
    .notNull()
    .references(() => recipes.id, {
      onDelete: 'cascade',
    }),

  ingredientId: uuid('ingredient_id')
    .notNull()
    .references(() => ingredients.id, {
      onDelete: 'restrict',
    }),

  quantity: numeric('quantity', { precision: 10, scale: 2 }).notNull(),

  unit: text('unit').notNull(),

  preparation: text('preparation'),

  isOptional: boolean('is_optional').notNull().default(false),

  createdAt: timestamp('created_at').notNull().defaultNow(),

  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
