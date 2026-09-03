import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';

export const foods = pgTable('foods', {
  id: uuid('id').defaultRandom().primaryKey(),

  name: text('name').notNull(),

  code: text('code').notNull().unique(),

  createdAt: timestamp('created_at').notNull().defaultNow(),
});
