import { db } from '../../lib/db.js';
import { dietTypes, allergens, foods, ingredients } from '../schema/index.js';

import { dietTypesSeed } from './diet-types.seed.js';
import { allergensSeed } from './allergens.seed.js';
import { foodsSeed } from './foods.seed.js';
import { ingredientsSeed } from './ingredients.seed.js';

async function seed() {
  console.log('🌱 Starting database seed...');

  await db.insert(dietTypes).values(dietTypesSeed).onConflictDoNothing();

  console.log('✅ Diet types seeded');

  await db.insert(allergens).values(allergensSeed).onConflictDoNothing();

  console.log('✅ Allergens seeded');

  await db.insert(foods).values(foodsSeed).onConflictDoNothing();

  console.log('✅ Foods seeded');

  await db.insert(ingredients).values(ingredientsSeed).onConflictDoNothing();

  console.log('✅ Ingredients seeded');

  console.log('🌱 Database seed completed');
}

seed()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    // If your db exposes a client/end connection, close it here.
  });
