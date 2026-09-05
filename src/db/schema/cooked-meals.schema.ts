import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { user } from './user.schema.js';
import { recipes } from './recipes.schema.js';
import { mealPlans } from './meal-plans.schema.js';

export const cookedMeals = pgTable('cooked_meals', {
  id: uuid('id').defaultRandom().primaryKey(),

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

  mealPlanId: uuid('meal_plan_id').references(() => mealPlans.id, {
    onDelete: 'set null',
  }),

  cookedAt: timestamp('cooked_at').notNull().defaultNow(),

  createdAt: timestamp('created_at').notNull().defaultNow(),
});
