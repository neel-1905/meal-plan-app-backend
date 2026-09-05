import {
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

import { user } from './user.schema.js';
import { recipes } from './recipes.schema.js';

export const recipeFeedback = pgTable(
  'recipe_feedback',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),

    recipeId: uuid('recipe_id')
      .notNull()
      .references(() => recipes.id, { onDelete: 'cascade' }),

    rating: integer('rating').notNull(),

    comment: text('comment'),

    createdAt: timestamp('created_at').notNull().defaultNow(),

    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    unique('recipe_feedback_user_recipe_unique').on(
      table.userId,
      table.recipeId,
    ),
  ],
);
