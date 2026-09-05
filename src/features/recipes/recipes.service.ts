import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { eq, asc, count, desc, ilike, inArray, and } from 'drizzle-orm';

import { db } from '../../lib/db.js';
import {
  ingredients,
  recipeCategories,
  recipeCategoriesMap,
  recipeIngredients,
  recipeInstructionIngredients,
  recipeInstructions,
  recipes,
} from '../../db/schema/index.js';

import { CreateRecipeDto } from './dto/create-recipe.dto.js';
import { RecipeQueryDto } from './dto/recipe-query.dto.js';
import { UpdateRecipeDto } from './dto/update-recipe.dto.js';

@Injectable()
export class RecipesService {
  async createRecipe(userId: string, dto: CreateRecipeDto) {
    return db.transaction(async (tx) => {
      /*
       * 1. Validate ingredient IDs
       */

      const ingredientIds = [
        ...new Set(
          dto.ingredients.map((ingredient) => ingredient.ingredientId),
        ),
      ];

      const existingIngredients = await tx
        .select({ id: ingredients.id })
        .from(ingredients)
        .where(inArray(ingredients.id, ingredientIds));

      if (existingIngredients.length !== ingredientIds.length) {
        throw new BadRequestException('One or more ingredient IDs are invalid');
      }

      /*
       * 2. Validate category IDs
       */

      const categoryIds = [...new Set(dto.categoryIds)];

      if (categoryIds.length > 0) {
        const existingCategories = await tx
          .select({ id: recipeCategories.id })
          .from(recipeCategories)
          .where(inArray(recipeCategories.id, categoryIds));

        if (existingCategories.length !== categoryIds.length) {
          throw new BadRequestException('One or more category IDs are invalid');
        }
      }

      /*
       * 3. Validate instruction step numbers
       */

      const stepNumbers = dto.instructions.map(
        (instruction) => instruction.stepNumber,
      );

      if (new Set(stepNumbers).size !== stepNumbers.length) {
        throw new BadRequestException(
          'Instruction step numbers must be unique',
        );
      }

      /*
       * 4. Validate ingredient indexes used by instructions
       */

      for (const instruction of dto.instructions) {
        const indexes = instruction.ingredientIndexes;

        if (new Set(indexes).size !== indexes.length) {
          throw new BadRequestException(
            `Duplicate ingredient index found in step ${instruction.stepNumber}`,
          );
        }

        for (const index of indexes) {
          if (index < 0 || index >= dto.ingredients.length) {
            throw new BadRequestException(
              `Invalid ingredient index ${index} in step ${instruction.stepNumber}`,
            );
          }
        }
      }

      /*
       * 5. Create recipe
       */

      const [recipe] = await tx
        .insert(recipes)
        .values({
          name: dto.name,
          description: dto.description,
          image: dto.image,
          cookingTime: dto.cookingTime,
          servings: dto.servings,
          createdBy: userId,
        })
        .returning();

      /*
       * 6. Create recipe ingredients
       */

      const createdIngredients = await tx
        .insert(recipeIngredients)
        .values(
          dto.ingredients.map((ingredient) => ({
            recipeId: recipe.id,
            ingredientId: ingredient.ingredientId,
            quantity: ingredient.quantity,
            unit: ingredient.unit,
            preparation: ingredient.preparation,
            isOptional: ingredient.isOptional,
          })),
        )
        .returning();

      /*
       * 7. Create recipe instructions
       */

      const createdInstructions = await tx
        .insert(recipeInstructions)
        .values(
          dto.instructions.map((instruction) => ({
            recipeId: recipe.id,
            stepNumber: instruction.stepNumber,
            instruction: instruction.instruction,
          })),
        )
        .returning();

      /*
       * 8. Map instructions to recipe ingredients
       *
       * ingredientIndexes refers to the indexes in dto.ingredients.
       */

      const instructionByStepNumber = new Map(
        createdInstructions.map((instruction) => [
          instruction.stepNumber,
          instruction,
        ]),
      );

      const instructionIngredientMappings = dto.instructions.flatMap(
        (instruction) => {
          const createdInstruction = instructionByStepNumber.get(
            instruction.stepNumber,
          );

          if (!createdInstruction) {
            throw new BadRequestException(
              `Instruction step ${instruction.stepNumber} could not be created`,
            );
          }

          return instruction.ingredientIndexes.map((ingredientIndex) => ({
            instructionId: createdInstruction.id,
            recipeIngredientId: createdIngredients[ingredientIndex].id,
          }));
        },
      );

      if (instructionIngredientMappings.length > 0) {
        await tx
          .insert(recipeInstructionIngredients)
          .values(instructionIngredientMappings);
      }

      /*
       * 9. Map recipe to categories
       */

      if (categoryIds.length > 0) {
        await tx.insert(recipeCategoriesMap).values(
          categoryIds.map((categoryId) => ({
            recipeId: recipe.id,
            categoryId,
          })),
        );
      }

      /*
       * 10. Return created recipe
       */

      return {
        recipe,
        ingredients: createdIngredients,
        instructions: createdInstructions,
        categoryIds,
      };
    });
  }

  async getRecipeById(recipeId: string) {
    const recipe = await db
      .select({
        id: recipes.id,
        name: recipes.name,
        description: recipes.description,
        image: recipes.image,
        cookingTime: recipes.cookingTime,
        servings: recipes.servings,
        createdBy: recipes.createdBy,
        createdAt: recipes.createdAt,
        updatedAt: recipes.updatedAt,
      })
      .from(recipes)
      .where(eq(recipes.id, recipeId))
      .limit(1);

    if (recipe.length === 0) {
      throw new NotFoundException('Recipe not found');
    }

    const recipeData = recipe[0];

    /*
     * Get ingredients
     */
    const recipeIngredientRows = await db
      .select({
        id: recipeIngredients.id,
        ingredientId: ingredients.id,
        name: ingredients.name,
        quantity: recipeIngredients.quantity,
        unit: recipeIngredients.unit,
        preparation: recipeIngredients.preparation,
        isOptional: recipeIngredients.isOptional,
      })
      .from(recipeIngredients)
      .innerJoin(
        ingredients,
        eq(recipeIngredients.ingredientId, ingredients.id),
      )
      .where(eq(recipeIngredients.recipeId, recipeId));

    /*
     * Get instructions
     */
    const instructionRows = await db
      .select({
        id: recipeInstructions.id,
        stepNumber: recipeInstructions.stepNumber,
        instruction: recipeInstructions.instruction,
        ingredientId: recipeIngredients.id,
        ingredientName: ingredients.name,
        ingredientQuantity: recipeIngredients.quantity,
        ingredientUnit: recipeIngredients.unit,
      })
      .from(recipeInstructions)
      .leftJoin(
        recipeInstructionIngredients,
        eq(recipeInstructionIngredients.instructionId, recipeInstructions.id),
      )
      .leftJoin(
        recipeIngredients,
        eq(
          recipeInstructionIngredients.recipeIngredientId,
          recipeIngredients.id,
        ),
      )
      .leftJoin(ingredients, eq(recipeIngredients.ingredientId, ingredients.id))
      .where(eq(recipeInstructions.recipeId, recipeId))
      .orderBy(recipeInstructions.stepNumber);

    /*
     * Get categories
     */
    const categoryRows = await db
      .select({
        id: recipeCategories.id,
        code: recipeCategories.code,
        name: recipeCategories.name,
        description: recipeCategories.description,
      })
      .from(recipeCategoriesMap)
      .innerJoin(
        recipeCategories,
        eq(recipeCategoriesMap.categoryId, recipeCategories.id),
      )
      .where(eq(recipeCategoriesMap.recipeId, recipeId))
      .orderBy(recipeCategories.name);

    /*
     * Group instruction ingredients
     */
    const instructionsMap = new Map<
      string,
      {
        id: string;
        stepNumber: number;
        instruction: string;
        ingredients: {
          id: string;
          name: string;
          quantity: string;
          unit: string;
        }[];
      }
    >();

    for (const row of instructionRows) {
      if (!instructionsMap.has(row.id)) {
        instructionsMap.set(row.id, {
          id: row.id,
          stepNumber: row.stepNumber,
          instruction: row.instruction,
          ingredients: [],
        });
      }

      if (row.ingredientId) {
        instructionsMap.get(row.id)!.ingredients.push({
          id: row.ingredientId,
          name: row.ingredientName!,
          quantity: row.ingredientQuantity!,
          unit: row.ingredientUnit!,
        });
      }
    }

    return {
      ...recipeData,
      ingredients: recipeIngredientRows,
      instructions: Array.from(instructionsMap.values()),
      categories: categoryRows,
    };
  }

  async getRecipes(query: RecipeQueryDto) {
    const { page = 1, limit = 10, search, categoryId } = query;

    const offset = (page - 1) * limit;

    /*
     * Find recipe IDs belonging to the requested category.
     *
     * We do this separately instead of joining recipeCategoriesMap
     * to the main recipe query. This prevents duplicate recipes
     * when a recipe belongs to multiple categories.
     */
    let categoryRecipeIds: string[] | undefined;

    if (categoryId) {
      const categoryRecipes = await db
        .select({
          recipeId: recipeCategoriesMap.recipeId,
        })
        .from(recipeCategoriesMap)
        .where(eq(recipeCategoriesMap.categoryId, categoryId));

      categoryRecipeIds = categoryRecipes.map((row) => row.recipeId);

      /*
       * No recipes belong to this category.
       */
      if (categoryRecipeIds.length === 0) {
        return {
          data: [],
          meta: {
            page,
            limit,
            total: 0,
            totalPages: 0,
          },
        };
      }
    }

    /*
     * Build filters for recipes.
     */
    const conditions = [];

    if (search) {
      conditions.push(ilike(recipes.name, `%${search}%`));
    }

    if (categoryRecipeIds) {
      conditions.push(inArray(recipes.id, categoryRecipeIds));
    }

    const whereCondition =
      conditions.length > 0 ? and(...conditions) : undefined;

    /*
     * Fetch recipes and total count.
     */
    const [recipeRows, totalRows] = await Promise.all([
      db
        .select({
          id: recipes.id,
          name: recipes.name,
          description: recipes.description,
          image: recipes.image,
          cookingTime: recipes.cookingTime,
          servings: recipes.servings,
          createdBy: recipes.createdBy,
          createdAt: recipes.createdAt,
          updatedAt: recipes.updatedAt,
        })
        .from(recipes)
        .where(whereCondition)
        .orderBy(desc(recipes.createdAt))
        .limit(limit)
        .offset(offset),

      db
        .select({
          count: count(),
        })
        .from(recipes)
        .where(whereCondition),
    ]);

    const total = Number(totalRows[0]?.count ?? 0);

    return {
      data: recipeRows,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateRecipe(userId: string, recipeId: string, dto: UpdateRecipeDto) {
    return db.transaction(async (tx) => {
      // --------------------------------------------------
      // Find recipe
      // --------------------------------------------------

      const [existingRecipe] = await tx
        .select({
          id: recipes.id,
          createdBy: recipes.createdBy,
        })
        .from(recipes)
        .where(eq(recipes.id, recipeId))
        .limit(1);

      if (!existingRecipe) {
        throw new NotFoundException('Recipe not found');
      }

      // --------------------------------------------------
      // Ownership check
      // --------------------------------------------------

      if (existingRecipe.createdBy !== userId) {
        throw new ForbiddenException(
          'You do not have permission to update this recipe',
        );
      }

      // --------------------------------------------------
      // Ingredients + instructions must be updated
      // together
      // --------------------------------------------------

      const ingredientsDto = dto.ingredients;
      const instructionsDto = dto.instructions;

      if (
        (ingredientsDto !== undefined && instructionsDto === undefined) ||
        (ingredientsDto === undefined && instructionsDto !== undefined)
      ) {
        throw new BadRequestException(
          'Ingredients and instructions must be provided together',
        );
      }

      // --------------------------------------------------
      // Update basic recipe fields
      // --------------------------------------------------

      const updateData: {
        name?: string;
        description?: string;
        image?: string;
        cookingTime?: number;
        servings?: number;
        updatedAt: Date;
      } = {
        updatedAt: new Date(),
      };

      if (dto.name !== undefined) {
        updateData.name = dto.name;
      }

      if (dto.description !== undefined) {
        updateData.description = dto.description;
      }

      if (dto.image !== undefined) {
        updateData.image = dto.image;
      }

      if (dto.cookingTime !== undefined) {
        updateData.cookingTime = dto.cookingTime;
      }

      if (dto.servings !== undefined) {
        updateData.servings = dto.servings;
      }

      const [updatedRecipe] = await tx
        .update(recipes)
        .set(updateData)
        .where(eq(recipes.id, recipeId))
        .returning();

      if (!updatedRecipe) {
        throw new NotFoundException('Recipe could not be updated');
      }

      // --------------------------------------------------
      // Update ingredients + instructions
      // --------------------------------------------------

      let updatedIngredients:
        (typeof recipeIngredients.$inferSelect)[] | undefined;

      if (ingredientsDto !== undefined && instructionsDto !== undefined) {
        // ----------------------------------------------
        // Validate ingredient IDs
        // ----------------------------------------------

        const ingredientIds = [
          ...new Set(
            ingredientsDto.map((ingredient) => ingredient.ingredientId),
          ),
        ];

        const existingIngredients = await tx
          .select({
            id: ingredients.id,
          })
          .from(ingredients)
          .where(inArray(ingredients.id, ingredientIds));

        if (existingIngredients.length !== ingredientIds.length) {
          throw new BadRequestException(
            'One or more ingredient IDs are invalid',
          );
        }

        // ----------------------------------------------
        // Validate instruction step numbers
        // ----------------------------------------------

        const stepNumbers = instructionsDto.map(
          (instruction) => instruction.stepNumber,
        );

        if (new Set(stepNumbers).size !== stepNumbers.length) {
          throw new BadRequestException(
            'Instruction step numbers must be unique',
          );
        }

        // ----------------------------------------------
        // Validate ingredient indexes
        // ----------------------------------------------

        for (const instruction of instructionsDto) {
          const indexes = instruction.ingredientIndexes;

          if (new Set(indexes).size !== indexes.length) {
            throw new BadRequestException(
              `Duplicate ingredient index found in step ${instruction.stepNumber}`,
            );
          }

          for (const index of indexes) {
            if (index < 0 || index >= ingredientsDto.length) {
              throw new BadRequestException(
                `Invalid ingredient index ${index} in step ${instruction.stepNumber}`,
              );
            }
          }
        }

        // ----------------------------------------------
        // Delete old ingredients
        // ----------------------------------------------

        await tx
          .delete(recipeIngredients)
          .where(eq(recipeIngredients.recipeId, recipeId));

        // ----------------------------------------------
        // Create new ingredients
        // ----------------------------------------------

        const createdIngredients = await tx
          .insert(recipeIngredients)
          .values(
            ingredientsDto.map((ingredient) => ({
              recipeId,
              ingredientId: ingredient.ingredientId,
              quantity: ingredient.quantity,
              unit: ingredient.unit,
              preparation: ingredient.preparation,
              isOptional: ingredient.isOptional,
            })),
          )
          .returning();

        // IMPORTANT:
        // Keep this local const so TypeScript knows
        // the value is definitely defined.
        updatedIngredients = createdIngredients;

        // ----------------------------------------------
        // Delete old instructions
        // ----------------------------------------------

        await tx
          .delete(recipeInstructions)
          .where(eq(recipeInstructions.recipeId, recipeId));

        // ----------------------------------------------
        // Create new instructions
        // ----------------------------------------------

        const updatedInstructions = await tx
          .insert(recipeInstructions)
          .values(
            instructionsDto.map((instruction) => ({
              recipeId,
              stepNumber: instruction.stepNumber,
              instruction: instruction.instruction,
            })),
          )
          .returning();

        // ----------------------------------------------
        // Map step number -> instruction ID
        // ----------------------------------------------

        const instructionByStepNumber = new Map(
          updatedInstructions.map((instruction) => [
            instruction.stepNumber,
            instruction.id,
          ]),
        );

        // ----------------------------------------------
        // Create instruction -> ingredient mappings
        // ----------------------------------------------

        const mappings: Array<
          typeof recipeInstructionIngredients.$inferInsert
        > = [];

        for (const instruction of instructionsDto) {
          const instructionId = instructionByStepNumber.get(
            instruction.stepNumber,
          );

          if (!instructionId) {
            throw new BadRequestException(
              `Instruction step ${instruction.stepNumber} could not be created`,
            );
          }

          for (const ingredientIndex of instruction.ingredientIndexes) {
            const createdIngredient = createdIngredients[ingredientIndex];

            if (!createdIngredient) {
              throw new BadRequestException(
                `Invalid ingredient index ${ingredientIndex} in step ${instruction.stepNumber}`,
              );
            }

            mappings.push({
              instructionId,
              recipeIngredientId: createdIngredient.id,
            });
          }
        }

        if (mappings.length > 0) {
          await tx.insert(recipeInstructionIngredients).values(mappings);
        }
      }

      // --------------------------------------------------
      // Update categories
      // --------------------------------------------------

      let updatedCategoryIds: string[] | undefined;

      if (dto.categoryIds !== undefined) {
        updatedCategoryIds = [...new Set(dto.categoryIds)];

        // ----------------------------------------------
        // Validate categories
        // ----------------------------------------------

        if (updatedCategoryIds.length > 0) {
          const existingCategories = await tx
            .select({
              id: recipeCategories.id,
            })
            .from(recipeCategories)
            .where(inArray(recipeCategories.id, updatedCategoryIds));

          if (existingCategories.length !== updatedCategoryIds.length) {
            throw new BadRequestException(
              'One or more category IDs are invalid',
            );
          }
        }

        // ----------------------------------------------
        // Remove old categories
        // ----------------------------------------------

        await tx
          .delete(recipeCategoriesMap)
          .where(eq(recipeCategoriesMap.recipeId, recipeId));

        // ----------------------------------------------
        // Add new categories
        // ----------------------------------------------

        if (updatedCategoryIds.length > 0) {
          await tx.insert(recipeCategoriesMap).values(
            updatedCategoryIds.map((categoryId) => ({
              recipeId,
              categoryId,
            })),
          );
        }
      }

      // --------------------------------------------------
      // Return
      // --------------------------------------------------

      return {
        recipe: updatedRecipe,

        ...(updatedIngredients !== undefined && {
          ingredients: updatedIngredients,
        }),

        ...(updatedCategoryIds !== undefined && {
          categoryIds: updatedCategoryIds,
        }),
      };
    });
  }

  async deleteRecipe(userId: string, recipeId: string) {
    return db.transaction(async (tx) => {
      // --------------------------------------------------
      // Find recipe
      // --------------------------------------------------

      const [existingRecipe] = await tx
        .select({
          id: recipes.id,
          createdBy: recipes.createdBy,
        })
        .from(recipes)
        .where(eq(recipes.id, recipeId))
        .limit(1);

      // --------------------------------------------------
      // Recipe doesn't exist
      // --------------------------------------------------

      if (!existingRecipe) {
        throw new NotFoundException('Recipe not found');
      }

      // --------------------------------------------------
      // Ownership check
      // --------------------------------------------------

      if (existingRecipe.createdBy !== userId) {
        throw new ForbiddenException(
          'You do not have permission to delete this recipe',
        );
      }

      // --------------------------------------------------
      // Delete recipe
      // --------------------------------------------------

      await tx.delete(recipes).where(eq(recipes.id, recipeId));

      return null;
    });
  }
}
