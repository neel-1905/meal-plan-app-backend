import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  pgEnum,
} from 'drizzle-orm/pg-core';

import { user } from './user.schema.js';

export const userPreferences = pgTable('user_preferences', {
  id: uuid('id').defaultRandom().primaryKey(),

  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => user.id, {
      onDelete: 'cascade',
    }),

  defaultServings: integer('default_servings').notNull(),

  onboardingCompleted: boolean('onboarding_completed').notNull().default(false),

  createdAt: timestamp('created_at').notNull().defaultNow(),

  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const servingSizeEnum = pgEnum('serving_size', ['2', '4', '6', '8']);
