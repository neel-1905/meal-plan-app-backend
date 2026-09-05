import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { user } from './user.schema.js';

export const collections = pgTable('collections', {
  id: uuid('id').defaultRandom().primaryKey(),

  userId: text('user_id')
    .notNull()
    .references(() => user.id, {
      onDelete: 'cascade',
    }),

  name: text('name').notNull(),

  createdAt: timestamp('created_at').notNull().defaultNow(),

  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
