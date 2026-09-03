import { pgTable, uuid, text, primaryKey } from 'drizzle-orm/pg-core';

import { user } from './user.schema.js';
import { dietTypes } from './diet-types.schema.js';

export const userDietTypes = pgTable(
  'user_diet_types',
  {
    userId: text('user_id')
      .notNull()
      .references(() => user.id, {
        onDelete: 'cascade',
      }),

    dietTypeId: uuid('diet_type_id')
      .notNull()
      .references(() => dietTypes.id, {
        onDelete: 'cascade',
      }),
  },
  (table) => [
    primaryKey({
      columns: [table.userId, table.dietTypeId],
    }),
  ],
);
