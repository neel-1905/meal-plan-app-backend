import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const ingredients = pgTable('ingredients', {
  id: uuid('id').defaultRandom().primaryKey(),

  code: text('code').notNull().unique(),

  name: text('name').notNull().unique(),

  description: text('description'),

  createdAt: timestamp('created_at').notNull().defaultNow(),

  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
