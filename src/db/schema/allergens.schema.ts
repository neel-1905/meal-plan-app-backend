import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';

export const allergens = pgTable('allergens', {
  id: uuid('id').defaultRandom().primaryKey(),

  name: text('name').notNull(),

  code: text('code').notNull().unique(),

  createdAt: timestamp('created_at').notNull().defaultNow(),
});
