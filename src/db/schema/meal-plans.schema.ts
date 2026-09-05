import {
  date,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

import { user } from './user.schema.js';
import { recipes } from './recipes.schema.js';

export const mealSlotEnum = pgEnum('meal_slot', [
  'BREAKFAST',
  'LUNCH',
  'DINNER',
  'SNACK',
]);

export const mealPlans = pgTable(
  'meal_plans',
  {
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

    date: date('date', {
      mode: 'string',
    }).notNull(),

    mealSlot: mealSlotEnum('meal_slot').notNull(),

    createdAt: timestamp('created_at').notNull().defaultNow(),

    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },

  // Table constraints
  (table) => [
    unique('meal_plans_user_date_slot_unique').on(
      table.userId,
      table.date,
      table.mealSlot,
    ),
  ],
);
