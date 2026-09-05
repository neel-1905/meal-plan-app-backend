import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { and, asc, eq, inArray, sql } from 'drizzle-orm';

import { db } from '../../lib/db.js';

import {
  groceryItems,
  groceryLists,
  ingredients,
  mealPlans,
  recipeIngredients,
  recipes,
} from '../../db/schema/index.js';

import { CreateGroceryListDto } from './dto/create-grocery-list.dto.js';
import { UpdateGroceryListDto } from './dto/update-grocery-list.dto.js';
import { CreateGroceryItemDto } from './dto/create-grocery-item.dto.js';
import { UpdateGroceryItemDto } from './dto/update-grocery-item.dto.js';

@Injectable()
export class GroceryListService {
  // =====================================================
  // CREATE LIST
  // =====================================================

  async createList(userId: string, dto: CreateGroceryListDto) {
    const [existingList] = await db
      .select({
        id: groceryLists.id,
      })
      .from(groceryLists)
      .where(
        and(eq(groceryLists.userId, userId), eq(groceryLists.name, dto.name)),
      )
      .limit(1);

    if (existingList) {
      throw new ConflictException(
        'A grocery list with this name already exists',
      );
    }

    const [list] = await db
      .insert(groceryLists)
      .values({
        userId,
        name: dto.name,
      })
      .returning();

    return list;
  }

  // =====================================================
  // GET LISTS
  // =====================================================

  async getLists(userId: string) {
    return db
      .select({
        id: groceryLists.id,
        name: groceryLists.name,
        createdAt: groceryLists.createdAt,
        updatedAt: groceryLists.updatedAt,
      })
      .from(groceryLists)
      .where(eq(groceryLists.userId, userId))
      .orderBy(asc(groceryLists.name));
  }

  // =====================================================
  // GET LIST BY ID
  // =====================================================

  async getListById(userId: string, listId: string) {
    const [list] = await db
      .select({
        id: groceryLists.id,
        name: groceryLists.name,
        createdAt: groceryLists.createdAt,
        updatedAt: groceryLists.updatedAt,
      })
      .from(groceryLists)
      .where(and(eq(groceryLists.id, listId), eq(groceryLists.userId, userId)))
      .limit(1);

    if (!list) {
      throw new NotFoundException('Grocery list not found');
    }

    const items = await db
      .select({
        id: groceryItems.id,
        ingredientId: groceryItems.ingredientId,
        name: groceryItems.name,
        quantity: groceryItems.quantity,
        unit: groceryItems.unit,
        isCompleted: groceryItems.isCompleted,
        createdAt: groceryItems.createdAt,
        updatedAt: groceryItems.updatedAt,
      })
      .from(groceryItems)
      .where(eq(groceryItems.groceryListId, listId))
      .orderBy(asc(groceryItems.isCompleted), asc(groceryItems.name));

    return {
      ...list,
      items,
    };
  }

  // =====================================================
  // UPDATE LIST
  // =====================================================

  async updateList(userId: string, listId: string, dto: UpdateGroceryListDto) {
    const [existingList] = await db
      .select({
        id: groceryLists.id,
        userId: groceryLists.userId,
      })
      .from(groceryLists)
      .where(eq(groceryLists.id, listId))
      .limit(1);

    if (!existingList) {
      throw new NotFoundException('Grocery list not found');
    }

    if (existingList.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this grocery list',
      );
    }

    if (dto.name !== undefined) {
      const [duplicate] = await db
        .select({
          id: groceryLists.id,
        })
        .from(groceryLists)
        .where(
          and(eq(groceryLists.userId, userId), eq(groceryLists.name, dto.name)),
        )
        .limit(1);

      if (duplicate && duplicate.id !== listId) {
        throw new ConflictException(
          'A grocery list with this name already exists',
        );
      }
    }

    const [updatedList] = await db
      .update(groceryLists)
      .set({
        ...(dto.name !== undefined && {
          name: dto.name,
        }),
        updatedAt: new Date(),
      })
      .where(and(eq(groceryLists.id, listId), eq(groceryLists.userId, userId)))
      .returning();

    return updatedList;
  }

  // =====================================================
  // DELETE LIST
  // =====================================================

  async deleteList(userId: string, listId: string) {
    const [existingList] = await db
      .select({
        id: groceryLists.id,
        userId: groceryLists.userId,
      })
      .from(groceryLists)
      .where(eq(groceryLists.id, listId))
      .limit(1);

    if (!existingList) {
      throw new NotFoundException('Grocery list not found');
    }

    if (existingList.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this grocery list',
      );
    }

    await db
      .delete(groceryLists)
      .where(and(eq(groceryLists.id, listId), eq(groceryLists.userId, userId)));

    return null;
  }

  // =====================================================
  // ADD ITEM
  // =====================================================

  async addItem(userId: string, listId: string, dto: CreateGroceryItemDto) {
    await this.assertListOwnership(userId, listId);

    if (dto.ingredientId) {
      const [ingredient] = await db
        .select({
          id: ingredients.id,
          name: ingredients.name,
        })
        .from(ingredients)
        .where(eq(ingredients.id, dto.ingredientId))
        .limit(1);

      if (!ingredient) {
        throw new NotFoundException('Ingredient not found');
      }
    }

    const [item] = await db
      .insert(groceryItems)
      .values({
        groceryListId: listId,
        ingredientId: dto.ingredientId,
        name: dto.name,
        quantity: dto.quantity,
        unit: dto.unit,
        isCompleted: false,
      })
      .returning();

    return item;
  }

  // =====================================================
  // UPDATE ITEM
  // =====================================================

  async updateItem(
    userId: string,
    listId: string,
    itemId: string,
    dto: UpdateGroceryItemDto,
  ) {
    await this.assertListOwnership(userId, listId);

    const [existingItem] = await db
      .select({
        id: groceryItems.id,
      })
      .from(groceryItems)
      .where(
        and(
          eq(groceryItems.id, itemId),
          eq(groceryItems.groceryListId, listId),
        ),
      )
      .limit(1);

    if (!existingItem) {
      throw new NotFoundException('Grocery item not found');
    }

    const [updatedItem] = await db
      .update(groceryItems)
      .set({
        ...(dto.name !== undefined && {
          name: dto.name,
        }),

        ...(dto.quantity !== undefined && {
          quantity: dto.quantity,
        }),

        ...(dto.unit !== undefined && {
          unit: dto.unit,
        }),

        ...(dto.isCompleted !== undefined && {
          isCompleted: dto.isCompleted,
        }),

        updatedAt: new Date(),
      })
      .where(
        and(
          eq(groceryItems.id, itemId),
          eq(groceryItems.groceryListId, listId),
        ),
      )
      .returning();

    return updatedItem;
  }

  // =====================================================
  // DELETE ITEM
  // =====================================================

  async deleteItem(userId: string, listId: string, itemId: string) {
    await this.assertListOwnership(userId, listId);

    const [existingItem] = await db
      .select({
        id: groceryItems.id,
      })
      .from(groceryItems)
      .where(
        and(
          eq(groceryItems.id, itemId),
          eq(groceryItems.groceryListId, listId),
        ),
      )
      .limit(1);

    if (!existingItem) {
      throw new NotFoundException('Grocery item not found');
    }

    await db
      .delete(groceryItems)
      .where(
        and(
          eq(groceryItems.id, itemId),
          eq(groceryItems.groceryListId, listId),
        ),
      );

    return null;
  }

  // =====================================================
  // GENERATE FROM MEAL PLAN
  // =====================================================

  async generateFromMealPlan(
    userId: string,
    listId: string,
    from: string,
    to: string,
  ) {
    await this.assertListOwnership(userId, listId);

    const plannedRecipes = await db
      .select({
        recipeId: mealPlans.recipeId,
      })
      .from(mealPlans)
      .where(
        and(
          eq(mealPlans.userId, userId),
          sqlDateGte(mealPlans.date, from),
          sqlDateLte(mealPlans.date, to),
        ),
      );

    if (plannedRecipes.length === 0) {
      return [];
    }

    const recipeIds = [...new Set(plannedRecipes.map((meal) => meal.recipeId))];

    const recipeIngredientRows = await db
      .select({
        ingredientId: recipeIngredients.ingredientId,

        name: ingredients.name,

        quantity: recipeIngredients.quantity,

        unit: recipeIngredients.unit,
      })
      .from(recipeIngredients)
      .innerJoin(
        ingredients,
        eq(recipeIngredients.ingredientId, ingredients.id),
      )
      .where(inArray(recipeIngredients.recipeId, recipeIds));

    /*
     * For now we insert each recipe ingredient
     * as an individual grocery item.
     *
     * Aggregating quantities can be added later,
     * especially when units differ.
     */

    if (recipeIngredientRows.length === 0) {
      return [];
    }

    const insertedItems = await db
      .insert(groceryItems)
      .values(
        recipeIngredientRows.map((item) => ({
          groceryListId: listId,
          ingredientId: item.ingredientId,
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
        })),
      )
      .returning();

    return insertedItems;
  }

  // =====================================================
  // OWNERSHIP
  // =====================================================

  private async assertListOwnership(userId: string, listId: string) {
    const [list] = await db
      .select({
        id: groceryLists.id,
      })
      .from(groceryLists)
      .where(and(eq(groceryLists.id, listId), eq(groceryLists.userId, userId)))
      .limit(1);

    if (!list) {
      throw new NotFoundException('Grocery list not found');
    }
  }
}

/*
 * Helper for comparing PostgreSQL date columns.
 *
 * mealPlans.date is a date column using mode: 'string'.
 */
function sqlDateGte(column: typeof mealPlans.date, value: string) {
  return sql`${column} >= ${value}`;
}

function sqlDateLte(column: typeof mealPlans.date, value: string) {
  return sql`${column} <= ${value}`;
}
