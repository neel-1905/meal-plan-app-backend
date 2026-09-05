import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { and, desc, eq } from 'drizzle-orm';

import { db } from '../../lib/db.js';

import {
  collectionRecipes,
  collections,
  recipes,
} from '../../db/schema/index.js';

import { CreateCollectionDto } from './dto/create-collection.dto.js';
import { UpdateCollectionDto } from './dto/update-collection.dto.js';

@Injectable()
export class CollectionsService {
  async createCollection(userId: string, dto: CreateCollectionDto) {
    const [existingCollection] = await db
      .select({
        id: collections.id,
      })
      .from(collections)
      .where(
        and(eq(collections.userId, userId), eq(collections.name, dto.name)),
      )
      .limit(1);

    if (existingCollection) {
      throw new ConflictException('A collection with this name already exists');
    }

    const [collection] = await db
      .insert(collections)
      .values({
        userId,
        name: dto.name,
      })
      .returning();

    return collection;
  }

  // =====================================================
  // GET USER COLLECTIONS
  // =====================================================

  async getCollections(userId: string) {
    return db
      .select({
        id: collections.id,
        name: collections.name,
        createdAt: collections.createdAt,
        updatedAt: collections.updatedAt,
      })
      .from(collections)
      .where(eq(collections.userId, userId))
      .orderBy(desc(collections.createdAt));
  }

  // =====================================================
  // GET COLLECTION BY ID
  // =====================================================

  async getCollectionById(userId: string, collectionId: string) {
    const [collection] = await db
      .select({
        id: collections.id,
        name: collections.name,
        createdAt: collections.createdAt,
        updatedAt: collections.updatedAt,
      })
      .from(collections)
      .where(
        and(eq(collections.id, collectionId), eq(collections.userId, userId)),
      )
      .limit(1);

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    const collectionRecipeList = await db
      .select({
        id: recipes.id,
        name: recipes.name,
        description: recipes.description,
        image: recipes.image,
        cookingTime: recipes.cookingTime,
        servings: recipes.servings,
        createdBy: recipes.createdBy,
        addedAt: collectionRecipes.createdAt,
      })
      .from(collectionRecipes)
      .innerJoin(recipes, eq(collectionRecipes.recipeId, recipes.id))
      .where(eq(collectionRecipes.collectionId, collectionId))
      .orderBy(desc(collectionRecipes.createdAt));

    return {
      ...collection,
      recipes: collectionRecipeList,
    };
  }

  // =====================================================
  // UPDATE COLLECTION
  // =====================================================

  async updateCollection(
    userId: string,
    collectionId: string,
    dto: UpdateCollectionDto,
  ) {
    const [existingCollection] = await db
      .select({
        id: collections.id,
        userId: collections.userId,
      })
      .from(collections)
      .where(eq(collections.id, collectionId))
      .limit(1);

    if (!existingCollection) {
      throw new NotFoundException('Collection not found');
    }

    if (existingCollection.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this collection',
      );
    }

    if (dto.name !== undefined) {
      const [duplicate] = await db
        .select({
          id: collections.id,
        })
        .from(collections)
        .where(
          and(eq(collections.userId, userId), eq(collections.name, dto.name)),
        )
        .limit(1);

      if (duplicate && duplicate.id !== collectionId) {
        throw new ConflictException(
          'A collection with this name already exists',
        );
      }
    }

    const [updatedCollection] = await db
      .update(collections)
      .set({
        ...(dto.name !== undefined && {
          name: dto.name,
        }),
        updatedAt: new Date(),
      })
      .where(
        and(eq(collections.id, collectionId), eq(collections.userId, userId)),
      )
      .returning();

    return updatedCollection;
  }

  // =====================================================
  // DELETE COLLECTION
  // =====================================================

  async deleteCollection(userId: string, collectionId: string) {
    const [existingCollection] = await db
      .select({
        id: collections.id,
        userId: collections.userId,
      })
      .from(collections)
      .where(eq(collections.id, collectionId))
      .limit(1);

    if (!existingCollection) {
      throw new NotFoundException('Collection not found');
    }

    if (existingCollection.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this collection',
      );
    }

    await db
      .delete(collections)
      .where(
        and(eq(collections.id, collectionId), eq(collections.userId, userId)),
      );

    return null;
  }

  // =====================================================
  // ADD RECIPE
  // =====================================================

  async addRecipe(userId: string, collectionId: string, recipeId: string) {
    const [collection] = await db
      .select({
        id: collections.id,
      })
      .from(collections)
      .where(
        and(eq(collections.id, collectionId), eq(collections.userId, userId)),
      )
      .limit(1);

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    const [recipe] = await db
      .select({
        id: recipes.id,
      })
      .from(recipes)
      .where(eq(recipes.id, recipeId))
      .limit(1);

    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    const [existingRecipe] = await db
      .select({
        collectionId: collectionRecipes.collectionId,
      })
      .from(collectionRecipes)
      .where(
        and(
          eq(collectionRecipes.collectionId, collectionId),
          eq(collectionRecipes.recipeId, recipeId),
        ),
      )
      .limit(1);

    if (existingRecipe) {
      throw new ConflictException('Recipe is already in this collection');
    }

    const [addedRecipe] = await db
      .insert(collectionRecipes)
      .values({
        collectionId,
        recipeId,
      })
      .returning();

    return addedRecipe;
  }

  // =====================================================
  // REMOVE RECIPE
  // =====================================================

  async removeRecipe(userId: string, collectionId: string, recipeId: string) {
    const [collection] = await db
      .select({
        id: collections.id,
      })
      .from(collections)
      .where(
        and(eq(collections.id, collectionId), eq(collections.userId, userId)),
      )
      .limit(1);

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    const [existingRecipe] = await db
      .select({
        collectionId: collectionRecipes.collectionId,
      })
      .from(collectionRecipes)
      .where(
        and(
          eq(collectionRecipes.collectionId, collectionId),
          eq(collectionRecipes.recipeId, recipeId),
        ),
      )
      .limit(1);

    if (!existingRecipe) {
      throw new NotFoundException('Recipe is not in this collection');
    }

    await db
      .delete(collectionRecipes)
      .where(
        and(
          eq(collectionRecipes.collectionId, collectionId),
          eq(collectionRecipes.recipeId, recipeId),
        ),
      );

    return null;
  }
}
