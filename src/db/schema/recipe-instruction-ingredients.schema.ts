import { pgTable, primaryKey, uuid } from 'drizzle-orm/pg-core';

import { recipeIngredients } from './recipe-ingredients.schema.js';
import { recipeInstructions } from './recipe-instructions.schema.js';

export const recipeInstructionIngredients = pgTable(
  'recipe_instruction_ingredients',
  {
    instructionId: uuid('instruction_id')
      .notNull()
      .references(() => recipeInstructions.id, {
        onDelete: 'cascade',
      }),

    recipeIngredientId: uuid('recipe_ingredient_id')
      .notNull()
      .references(() => recipeIngredients.id, {
        onDelete: 'cascade',
      }),
  },
  (table) => [
    primaryKey({
      columns: [table.instructionId, table.recipeIngredientId],
    }),
  ],
);
