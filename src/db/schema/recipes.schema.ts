import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { user } from './user.schema.js';

export const recipes = pgTable('recipes', {
  id: uuid('id').defaultRandom().primaryKey(),

  name: text('name').notNull(),

  description: text('description'),

  image: text('image'),

  cookingTime: integer('cooking_time').notNull(),

  servings: integer('servings').notNull(),

  createdBy: text('created_by').references(() => user.id, {
    onDelete: 'set null',
  }),

  createdAt: timestamp('created_at').notNull().defaultNow(),

  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
