import {
  boolean,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

import { groceryLists } from './grocery-lists.schema.js';
import { ingredients } from './ingredients.schema.js';

export const groceryItems = pgTable('grocery_items', {
  id: uuid('id').defaultRandom().primaryKey(),

  groceryListId: uuid('grocery_list_id')
    .notNull()
    .references(() => groceryLists.id, {
      onDelete: 'cascade',
    }),

  /*
   * Nullable because manually added grocery items
   * don't necessarily belong to our ingredient catalog.
   */
  ingredientId: uuid('ingredient_id').references(() => ingredients.id, {
    onDelete: 'set null',
  }),

  name: text('name').notNull(),

  quantity: numeric('quantity', {
    precision: 10,
    scale: 2,
  }),

  unit: text('unit'),

  isCompleted: boolean('is_completed').notNull().default(false),

  createdAt: timestamp('created_at').notNull().defaultNow(),

  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
