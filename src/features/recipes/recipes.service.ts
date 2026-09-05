import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { and, asc, desc, eq, ilike, inArray, sql } from 'drizzle-orm';

import { db } from '../../lib/db.js';

import {
  allergens,
  dietTypes,
  foods,
  ingredients,
  recipeAllergens,
  recipeCategories,
  recipeCategoriesMap,
  recipeDietTypes,
  recipeFoods,
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
  /*
   * ============================================================
   * CREATE RECIPE
   * ============================================================
   */

  async createRecipe(userId: string, dto: CreateRecipeDto) {
    return db.transaction(async (tx) => {
      /*
       * --------------------------------------------------------
       * 1. Validate ingredient IDs
       * --------------------------------------------------------
       */

      const ingredientIds = [
        ...new Set(
          dto.ingredients.map((ingredient) => ingredient.ingredientId),
        ),
      ];

      const existingIngredients = await tx
        .select({
          id: ingredients.id,
        })
        .from(ingredients)
        .where(inArray(ingredients.id, ingredientIds));

      if (existingIngredients.length !== ingredientIds.length) {
        throw new BadRequestException('One or more ingredient IDs are invalid');
      }

      /*
       * --------------------------------------------------------
       * 2. Validate category IDs
       * --------------------------------------------------------
       */

      const categoryIds = [...new Set(dto.categoryIds)];

      if (categoryIds.length > 0) {
        const existingCategories = await tx
          .select({
            id: recipeCategories.id,
          })
          .from(recipeCategories)
          .where(inArray(recipeCategories.id, categoryIds));

        if (existingCategories.length !== categoryIds.length) {
          throw new BadRequestException('One or more category IDs are invalid');
        }
      }

      /*
       * --------------------------------------------------------
       * 3. Validate diet type IDs
       * --------------------------------------------------------
       */

      const dietTypeIds = [...new Set(dto.dietTypeIds)];

      if (dietTypeIds.length > 0) {
        const existingDietTypes = await tx
          .select({
            id: dietTypes.id,
          })
          .from(dietTypes)
          .where(inArray(dietTypes.id, dietTypeIds));

        if (existingDietTypes.length !== dietTypeIds.length) {
          throw new BadRequestException(
            'One or more diet type IDs are invalid',
          );
        }
      }

      /*
       * --------------------------------------------------------
       * 4. Validate allergen IDs
       * --------------------------------------------------------
       */

      const allergenIds = [...new Set(dto.allergenIds)];

      if (allergenIds.length > 0) {
        const existingAllergens = await tx
          .select({
            id: allergens.id,
          })
          .from(allergens)
          .where(inArray(allergens.id, allergenIds));

        if (existingAllergens.length !== allergenIds.length) {
          throw new BadRequestException('One or more allergen IDs are invalid');
        }
      }

      /*
       * --------------------------------------------------------
       * 5. Validate food IDs
       * --------------------------------------------------------
       */

      const foodIds = [...new Set(dto.foodIds)];

      if (foodIds.length > 0) {
        const existingFoods = await tx
          .select({
            id: foods.id,
          })
          .from(foods)
          .where(inArray(foods.id, foodIds));

        if (existingFoods.length !== foodIds.length) {
          throw new BadRequestException('One or more food IDs are invalid');
        }
      }

      /*
       * --------------------------------------------------------
       * 6. Validate instruction step numbers
       * --------------------------------------------------------
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
       * --------------------------------------------------------
       * 7. Validate ingredient indexes
       * --------------------------------------------------------
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
       * --------------------------------------------------------
       * 8. Create recipe
       * --------------------------------------------------------
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
       * --------------------------------------------------------
       * 9. Create recipe ingredients
       * --------------------------------------------------------
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
       * --------------------------------------------------------
       * 10. Create recipe instructions
       * --------------------------------------------------------
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
       * --------------------------------------------------------
       * 11. Map instructions to ingredients
       * --------------------------------------------------------
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

          return instruction.ingredientIndexes.map((ingredientIndex) => {
            const createdIngredient = createdIngredients[ingredientIndex];

            if (!createdIngredient) {
              throw new BadRequestException(
                `Invalid ingredient index ${ingredientIndex}`,
              );
            }

            return {
              instructionId: createdInstruction.id,
              recipeIngredientId: createdIngredient.id,
            };
          });
        },
      );

      if (instructionIngredientMappings.length > 0) {
        await tx
          .insert(recipeInstructionIngredients)
          .values(instructionIngredientMappings);
      }

      /*
       * --------------------------------------------------------
       * 12. Map recipe to categories
       * --------------------------------------------------------
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
       * --------------------------------------------------------
       * 13. Map recipe to diet types
       * --------------------------------------------------------
       */

      if (dietTypeIds.length > 0) {
        await tx.insert(recipeDietTypes).values(
          dietTypeIds.map((dietTypeId) => ({
            recipeId: recipe.id,
            dietTypeId,
          })),
        );
      }

      /*
       * --------------------------------------------------------
       * 14. Map recipe to allergens
       * --------------------------------------------------------
       */

      if (allergenIds.length > 0) {
        await tx.insert(recipeAllergens).values(
          allergenIds.map((allergenId) => ({
            recipeId: recipe.id,
            allergenId,
          })),
        );
      }

      /*
       * --------------------------------------------------------
       * 15. Map recipe to foods
       * --------------------------------------------------------
       */

      if (foodIds.length > 0) {
        await tx.insert(recipeFoods).values(
          foodIds.map((foodId) => ({
            recipeId: recipe.id,
            foodId,
          })),
        );
      }

      /*
       * --------------------------------------------------------
       * 16. Return created recipe
       * --------------------------------------------------------
       */

      return {
        recipe,
        ingredients: createdIngredients,
        instructions: createdInstructions,
        categoryIds,
        dietTypeIds,
        allergenIds,
        foodIds,
      };
    });
  }

  /*
   * ============================================================
   * GET RECIPE BY ID
   * ============================================================
   */

  async getRecipeById(recipeId: string) {
    /*
     * --------------------------------------------------------
     * Get recipe
     * --------------------------------------------------------
     */

    const recipeRows = await db
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

    if (recipeRows.length === 0) {
      throw new NotFoundException('Recipe not found');
    }

    const recipeData = recipeRows[0];

    /*
     * --------------------------------------------------------
     * Get ingredients
     * --------------------------------------------------------
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
      .where(eq(recipeIngredients.recipeId, recipeId))
      .orderBy(asc(recipeIngredients.createdAt));

    /*
     * --------------------------------------------------------
     * Get instructions + their ingredients
     * --------------------------------------------------------
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
      .orderBy(asc(recipeInstructions.stepNumber));

    /*
     * --------------------------------------------------------
     * Get categories
     * --------------------------------------------------------
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
      .orderBy(asc(recipeCategories.name));

    /*
     * --------------------------------------------------------
     * Get diet types
     * --------------------------------------------------------
     */

    const dietTypeRows = await db
      .select({
        id: dietTypes.id,
        code: dietTypes.code,
        name: dietTypes.name,
        description: dietTypes.description,
      })
      .from(recipeDietTypes)
      .innerJoin(dietTypes, eq(recipeDietTypes.dietTypeId, dietTypes.id))
      .where(eq(recipeDietTypes.recipeId, recipeId))
      .orderBy(asc(dietTypes.name));

    /*
     * --------------------------------------------------------
     * Get allergens
     * --------------------------------------------------------
     */

    const allergenRows = await db
      .select({
        id: allergens.id,
        code: allergens.code,
        name: allergens.name,
        description: allergens.description,
      })
      .from(recipeAllergens)
      .innerJoin(allergens, eq(recipeAllergens.allergenId, allergens.id))
      .where(eq(recipeAllergens.recipeId, recipeId))
      .orderBy(asc(allergens.name));

    /*
     * --------------------------------------------------------
     * Get foods
     * --------------------------------------------------------
     */

    const foodRows = await db
      .select({
        id: foods.id,
        code: foods.code,
        name: foods.name,
        description: foods.description,
      })
      .from(recipeFoods)
      .innerJoin(foods, eq(recipeFoods.foodId, foods.id))
      .where(eq(recipeFoods.recipeId, recipeId))
      .orderBy(asc(foods.name));

    /*
     * --------------------------------------------------------
     * Group instruction ingredients
     * --------------------------------------------------------
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

    /*
     * --------------------------------------------------------
     * Return complete recipe
     * --------------------------------------------------------
     */

    return {
      ...recipeData,

      ingredients: recipeIngredientRows,

      instructions: Array.from(instructionsMap.values()),

      categories: categoryRows,

      dietTypes: dietTypeRows,

      allergens: allergenRows,

      foods: foodRows,
    };
  }

  /*
   * ============================================================
   * GET RECIPES
   * ============================================================
   */

  async getRecipes(query: RecipeQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      categoryId,
      dietTypeId,
      maxCookingTime,
      sortBy,
      sortOrder,
    } = query;

    const conditions = [];

    if (search) {
      conditions.push(ilike(recipes.name, `%${search}%`));
    }

    if (maxCookingTime !== undefined) {
      conditions.push(sql`${recipes.cookingTime} <= ${maxCookingTime}`);
    }

    if (categoryId) {
      conditions.push(
        sql`EXISTS (
           SELECT 1
           FROM ${recipeCategoriesMap}
           WHERE ${recipeCategoriesMap.recipeId} = ${recipes.id}
           AND ${recipeCategoriesMap.categoryId} = ${categoryId}
         )`,
      );
    }

    if (dietTypeId) {
      conditions.push(
        sql`EXISTS (
           SELECT 1
           FROM ${recipeDietTypes}
           WHERE ${recipeDietTypes.recipeId} = ${recipes.id}
           AND ${recipeDietTypes.dietTypeId} = ${dietTypeId}
         )`,
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    let orderBy;

    if (sortBy === 'name') {
      orderBy = sortOrder === 'desc' ? desc(recipes.name) : asc(recipes.name);
    } else if (sortBy === 'cookingTime') {
      orderBy =
        sortOrder === 'desc'
          ? desc(recipes.cookingTime)
          : asc(recipes.cookingTime);
    } else {
      orderBy =
        sortOrder === 'asc' ? asc(recipes.createdAt) : desc(recipes.createdAt);
    }

    const offset = (page - 1) * limit;

    const [data, totalResult] = await Promise.all([
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
        .where(whereClause)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset),

      db
        .select({
          count: sql<number>`count(*)`,
        })
        .from(recipes)
        .where(whereClause),
    ]);

    const total = Number(totalResult[0]?.count ?? 0);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /*
   * ============================================================
   * UPDATE RECIPE
   * ============================================================
   */

  async updateRecipe(userId: string, recipeId: string, dto: UpdateRecipeDto) {
    /*
     * We return the ID from the transaction,
     * then fetch the complete recipe afterwards.
     *
     * This avoids calling getRecipeById()
     * using the normal db connection while
     * the transaction is still running.
     */

    const updatedRecipeId = await db.transaction(async (tx) => {
      /*
       * ------------------------------------------------------
       * 1. Find recipe
       * ------------------------------------------------------
       */

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

      /*
       * ------------------------------------------------------
       * 2. Ownership check
       * ------------------------------------------------------
       */

      if (existingRecipe.createdBy !== userId) {
        throw new ForbiddenException(
          'You do not have permission to update this recipe',
        );
      }

      /*
       * ------------------------------------------------------
       * 3. Validate diet types
       * ------------------------------------------------------
       */

      if (dto.dietTypeIds !== undefined) {
        const uniqueDietTypeIds = [...new Set(dto.dietTypeIds)];

        if (uniqueDietTypeIds.length !== dto.dietTypeIds.length) {
          throw new BadRequestException(
            'Duplicate diet type IDs are not allowed',
          );
        }

        if (uniqueDietTypeIds.length > 0) {
          const existingDietTypes = await tx
            .select({
              id: dietTypes.id,
            })
            .from(dietTypes)
            .where(inArray(dietTypes.id, uniqueDietTypeIds));

          if (existingDietTypes.length !== uniqueDietTypeIds.length) {
            throw new BadRequestException(
              'One or more diet types do not exist',
            );
          }
        }
      }

      /*
       * ------------------------------------------------------
       * 4. Validate allergens
       * ------------------------------------------------------
       */

      if (dto.allergenIds !== undefined) {
        const uniqueAllergenIds = [...new Set(dto.allergenIds)];

        if (uniqueAllergenIds.length !== dto.allergenIds.length) {
          throw new BadRequestException(
            'Duplicate allergen IDs are not allowed',
          );
        }

        if (uniqueAllergenIds.length > 0) {
          const existingAllergens = await tx
            .select({
              id: allergens.id,
            })
            .from(allergens)
            .where(inArray(allergens.id, uniqueAllergenIds));

          if (existingAllergens.length !== uniqueAllergenIds.length) {
            throw new BadRequestException('One or more allergens do not exist');
          }
        }
      }

      /*
       * ------------------------------------------------------
       * 5. Validate foods
       * ------------------------------------------------------
       */

      if (dto.foodIds !== undefined) {
        const uniqueFoodIds = [...new Set(dto.foodIds)];

        if (uniqueFoodIds.length !== dto.foodIds.length) {
          throw new BadRequestException('Duplicate food IDs are not allowed');
        }

        if (uniqueFoodIds.length > 0) {
          const existingFoods = await tx
            .select({
              id: foods.id,
            })
            .from(foods)
            .where(inArray(foods.id, uniqueFoodIds));

          if (existingFoods.length !== uniqueFoodIds.length) {
            throw new BadRequestException('One or more foods do not exist');
          }
        }
      }

      /*
       * ------------------------------------------------------
       * 6. Validate categories
       * ------------------------------------------------------
       */

      if (dto.categoryIds !== undefined) {
        const uniqueCategoryIds = [...new Set(dto.categoryIds)];

        if (uniqueCategoryIds.length !== dto.categoryIds.length) {
          throw new BadRequestException(
            'Duplicate category IDs are not allowed',
          );
        }

        if (uniqueCategoryIds.length > 0) {
          const existingCategories = await tx
            .select({
              id: recipeCategories.id,
            })
            .from(recipeCategories)
            .where(inArray(recipeCategories.id, uniqueCategoryIds));

          if (existingCategories.length !== uniqueCategoryIds.length) {
            throw new BadRequestException(
              'One or more categories do not exist',
            );
          }
        }
      }

      /*
       * ------------------------------------------------------
       * 7. Validate ingredients
       * ------------------------------------------------------
       */

      const ingredientsDto = dto.ingredients;

      const instructionsDto = dto.instructions;

      if (ingredientsDto !== undefined) {
        const ingredientIds = [
          ...new Set(
            ingredientsDto.map((ingredient) => ingredient.ingredientId),
          ),
        ];

        if (ingredientIds.length !== ingredientsDto.length) {
          throw new BadRequestException(
            'The same ingredient cannot be added more than once',
          );
        }

        if (ingredientIds.length > 0) {
          const existingIngredients = await tx
            .select({
              id: ingredients.id,
            })
            .from(ingredients)
            .where(inArray(ingredients.id, ingredientIds));

          if (existingIngredients.length !== ingredientIds.length) {
            throw new BadRequestException(
              'One or more ingredients do not exist',
            );
          }
        }
      }

      /*
       * ------------------------------------------------------
       * 8. Validate instructions
       * ------------------------------------------------------
       */

      if (instructionsDto !== undefined) {
        const stepNumbers = instructionsDto.map(
          (instruction) => instruction.stepNumber,
        );

        if (new Set(stepNumbers).size !== stepNumbers.length) {
          throw new BadRequestException(
            'Instruction step numbers must be unique',
          );
        }

        const ingredientCount = ingredientsDto?.length ?? 0;

        for (const instruction of instructionsDto) {
          for (const ingredientIndex of instruction.ingredientIndexes) {
            if (ingredientIndex < 0 || ingredientIndex >= ingredientCount) {
              throw new BadRequestException(
                `Invalid ingredient index ${ingredientIndex} in instruction step ${instruction.stepNumber}`,
              );
            }
          }
        }
      }

      /*
       * ------------------------------------------------------
       * 9. Update basic recipe fields
       * ------------------------------------------------------
       */

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

      await tx.update(recipes).set(updateData).where(eq(recipes.id, recipeId));

      /*
       * ------------------------------------------------------
       * 10. Replace ingredients + instructions
       * ------------------------------------------------------
       */

      if (ingredientsDto !== undefined || instructionsDto !== undefined) {
        /*
         * Because instructions reference
         * recipeIngredients, recreate both.
         */

        await tx
          .delete(recipeInstructions)
          .where(eq(recipeInstructions.recipeId, recipeId));

        await tx
          .delete(recipeIngredients)
          .where(eq(recipeIngredients.recipeId, recipeId));

        let updatedIngredients: (typeof recipeIngredients.$inferSelect)[] = [];

        /*
         * Create ingredients
         */

        if (ingredientsDto !== undefined && ingredientsDto.length > 0) {
          updatedIngredients = await tx
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
        }

        /*
         * Create instructions
         */

        if (instructionsDto !== undefined && instructionsDto.length > 0) {
          const createdInstructions = await tx
            .insert(recipeInstructions)
            .values(
              instructionsDto.map((instruction) => ({
                recipeId,
                stepNumber: instruction.stepNumber,
                instruction: instruction.instruction,
              })),
            )
            .returning();

          /*
           * Map instruction ingredients
           */

          const mappings = [];

          for (let i = 0; i < instructionsDto.length; i++) {
            const instructionDto = instructionsDto[i];

            const createdInstruction = createdInstructions[i];

            if (!createdInstruction) {
              throw new BadRequestException(
                'Failed to create recipe instruction',
              );
            }

            for (const ingredientIndex of instructionDto.ingredientIndexes) {
              const createdIngredient = updatedIngredients[ingredientIndex];

              if (!createdIngredient) {
                throw new BadRequestException(
                  `Invalid ingredient index ${ingredientIndex}`,
                );
              }

              mappings.push({
                instructionId: createdInstruction.id,

                recipeIngredientId: createdIngredient.id,
              });
            }
          }

          if (mappings.length > 0) {
            await tx.insert(recipeInstructionIngredients).values(mappings);
          }
        }
      }

      /*
       * ------------------------------------------------------
       * 11. Replace categories
       * ------------------------------------------------------
       */

      if (dto.categoryIds !== undefined) {
        await tx
          .delete(recipeCategoriesMap)
          .where(eq(recipeCategoriesMap.recipeId, recipeId));

        if (dto.categoryIds.length > 0) {
          await tx.insert(recipeCategoriesMap).values(
            dto.categoryIds.map((categoryId) => ({
              recipeId,
              categoryId,
            })),
          );
        }
      }

      /*
       * ------------------------------------------------------
       * 12. Replace diet types
       * ------------------------------------------------------
       */

      if (dto.dietTypeIds !== undefined) {
        await tx
          .delete(recipeDietTypes)
          .where(eq(recipeDietTypes.recipeId, recipeId));

        if (dto.dietTypeIds.length > 0) {
          await tx.insert(recipeDietTypes).values(
            dto.dietTypeIds.map((dietTypeId) => ({
              recipeId,
              dietTypeId,
            })),
          );
        }
      }

      /*
       * ------------------------------------------------------
       * 13. Replace allergens
       * ------------------------------------------------------
       */

      if (dto.allergenIds !== undefined) {
        await tx
          .delete(recipeAllergens)
          .where(eq(recipeAllergens.recipeId, recipeId));

        if (dto.allergenIds.length > 0) {
          await tx.insert(recipeAllergens).values(
            dto.allergenIds.map((allergenId) => ({
              recipeId,
              allergenId,
            })),
          );
        }
      }

      /*
       * ------------------------------------------------------
       * 14. Replace foods
       * ------------------------------------------------------
       */

      if (dto.foodIds !== undefined) {
        await tx.delete(recipeFoods).where(eq(recipeFoods.recipeId, recipeId));

        if (dto.foodIds.length > 0) {
          await tx.insert(recipeFoods).values(
            dto.foodIds.map((foodId) => ({
              recipeId,
              foodId,
            })),
          );
        }
      }

      return recipeId;
    });

    /*
     * Fetch the complete recipe
     * after the transaction commits.
     */

    return this.getRecipeById(updatedRecipeId);
  }

  /*
   * ============================================================
   * DELETE RECIPE
   * ============================================================
   */

  async deleteRecipe(userId: string, recipeId: string) {
    return db.transaction(async (tx) => {
      /*
       * ------------------------------------------------------
       * Find recipe
       * ------------------------------------------------------
       */

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

      /*
       * ------------------------------------------------------
       * Ownership check
       * ------------------------------------------------------
       */

      if (existingRecipe.createdBy !== userId) {
        throw new ForbiddenException(
          'You do not have permission to delete this recipe',
        );
      }

      /*
       * ------------------------------------------------------
       * Delete recipe
       * ------------------------------------------------------
       */

      await tx.delete(recipes).where(eq(recipes.id, recipeId));

      return null;
    });
  }
}
