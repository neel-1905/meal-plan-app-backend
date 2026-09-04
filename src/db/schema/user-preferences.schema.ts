import {
  boolean,
  pgEnum,
  pgTable,
  text,
  time,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

import { user } from './user.schema.js';

export const servingSizeEnum = pgEnum('serving_size', ['2', '4', '6', '8']);

export const reminderDayEnum = pgEnum('reminder_day', [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
]);

export const userPreferences = pgTable('user_preferences', {
  id: uuid('id').defaultRandom().primaryKey(),

  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => user.id, {
      onDelete: 'cascade',
    }),

  defaultServings: servingSizeEnum('default_servings').notNull(),

  reminderEnabled: boolean('reminder_enabled').notNull().default(false),

  reminderDay: reminderDayEnum('reminder_day'),

  reminderTime: time('reminder_time'),

  onboardingCompleted: boolean('onboarding_completed').notNull().default(false),

  createdAt: timestamp('created_at').notNull().defaultNow(),

  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
