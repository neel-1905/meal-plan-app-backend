import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { recipes } from './recipes.schema.js';

export const recipeInstructions = pgTable('recipe_instructions', {
  id: uuid('id').defaultRandom().primaryKey(),

  recipeId: uuid('recipe_id')
    .notNull()
    .references(() => recipes.id, {
      onDelete: 'cascade',
    }),

  stepNumber: integer('step_number').notNull(),

  instruction: text('instruction').notNull(),

  createdAt: timestamp('created_at').notNull().defaultNow(),

  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
