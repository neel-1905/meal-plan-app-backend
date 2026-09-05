import {
  ConflictException,
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
  recipeNutrition,
  recipes,
} from '../../db/schema/index.js';

import { CreateRecipeDto } from './dto/create-recipe.dto.js';
import { RecipeQueryDto } from './dto/recipe-query.dto.js';
import { UpdateRecipeDto } from './dto/update-recipe.dto.js';

@Injectable()
export class RecipesService {
  // ============================================================
  // CREATE
  // ============================================================

  async createRecipe(userId: string, dto: CreateRecipeDto) {
    return db.transaction(async (tx) => {
      // --------------------------------------------------------
      // Validate ingredient IDs
      // --------------------------------------------------------

      const ingredientIds = dto.ingredients.map(
        (ingredient) => ingredient.ingredientId,
      );

      const existingIngredients = await tx
        .select({
          id: ingredients.id,
        })
        .from(ingredients)
        .where(inArray(ingredients.id, ingredientIds));

      if (existingIngredients.length !== ingredientIds.length) {
        throw new NotFoundException('One or more ingredients were not found');
      }

      // --------------------------------------------------------
      // Validate category IDs
      // --------------------------------------------------------

      if (dto.categoryIds.length > 0) {
        const existingCategories = await tx
          .select({
            id: recipeCategories.id,
          })
          .from(recipeCategories)
          .where(inArray(recipeCategories.id, dto.categoryIds));

        if (existingCategories.length !== dto.categoryIds.length) {
          throw new NotFoundException('One or more categories were not found');
        }
      }

      // --------------------------------------------------------
      // Validate diet type IDs
      // --------------------------------------------------------

      if (dto.dietTypeIds.length > 0) {
        const existingDietTypes = await tx
          .select({
            id: dietTypes.id,
          })
          .from(dietTypes)
          .where(inArray(dietTypes.id, dto.dietTypeIds));

        if (existingDietTypes.length !== dto.dietTypeIds.length) {
          throw new NotFoundException('One or more diet types were not found');
        }
      }

      // --------------------------------------------------------
      // Validate allergen IDs
      // --------------------------------------------------------

      if (dto.allergenIds.length > 0) {
        const existingAllergens = await tx
          .select({
            id: allergens.id,
          })
          .from(allergens)
          .where(inArray(allergens.id, dto.allergenIds));

        if (existingAllergens.length !== dto.allergenIds.length) {
          throw new NotFoundException('One or more allergens were not found');
        }
      }

      // --------------------------------------------------------
      // Validate food IDs
      // --------------------------------------------------------

      if (dto.foodIds.length > 0) {
        const existingFoods = await tx
          .select({
            id: foods.id,
          })
          .from(foods)
          .where(inArray(foods.id, dto.foodIds));

        if (existingFoods.length !== dto.foodIds.length) {
          throw new NotFoundException('One or more foods were not found');
        }
      }

      // --------------------------------------------------------
      // Validate instruction step numbers
      // --------------------------------------------------------

      const stepNumbers = dto.instructions.map(
        (instruction) => instruction.stepNumber,
      );

      if (new Set(stepNumbers).size !== stepNumbers.length) {
        throw new ConflictException('Instruction step numbers must be unique');
      }

      // --------------------------------------------------------
      // Validate instruction ingredient indexes
      // --------------------------------------------------------

      for (const instruction of dto.instructions) {
        for (const index of instruction.ingredientIndexes) {
          if (index < 0 || index >= dto.ingredients.length) {
            throw new ConflictException(
              `Invalid ingredient index ${index} in instruction step ${instruction.stepNumber}`,
            );
          }
        }
      }

      // --------------------------------------------------------
      // Create recipe
      // --------------------------------------------------------

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

      // --------------------------------------------------------
      // Create recipe ingredients
      // --------------------------------------------------------

      const createdRecipeIngredients = await tx
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
        .returning({
          id: recipeIngredients.id,
        });

      // --------------------------------------------------------
      // Create instructions
      // --------------------------------------------------------

      const createdInstructions = await tx
        .insert(recipeInstructions)
        .values(
          dto.instructions.map((instruction) => ({
            recipeId: recipe.id,
            stepNumber: instruction.stepNumber,
            instruction: instruction.instruction,
          })),
        )
        .returning({
          id: recipeInstructions.id,
          stepNumber: recipeInstructions.stepNumber,
        });

      // --------------------------------------------------------
      // Map instruction -> ingredients
      // --------------------------------------------------------

      const instructionIngredientMappings = [];

      for (const instruction of dto.instructions) {
        const createdInstruction = createdInstructions.find(
          (item) => item.stepNumber === instruction.stepNumber,
        );

        if (!createdInstruction) {
          throw new ConflictException(
            `Could not create instruction step ${instruction.stepNumber}`,
          );
        }

        for (const ingredientIndex of instruction.ingredientIndexes) {
          const recipeIngredient = createdRecipeIngredients[ingredientIndex];

          instructionIngredientMappings.push({
            instructionId: createdInstruction.id,
            recipeIngredientId: recipeIngredient.id,
          });
        }
      }

      if (instructionIngredientMappings.length > 0) {
        await tx
          .insert(recipeInstructionIngredients)
          .values(instructionIngredientMappings);
      }

      // --------------------------------------------------------
      // Categories
      // --------------------------------------------------------

      if (dto.categoryIds.length > 0) {
        await tx.insert(recipeCategoriesMap).values(
          dto.categoryIds.map((categoryId) => ({
            recipeId: recipe.id,
            categoryId,
          })),
        );
      }

      // --------------------------------------------------------
      // Diet types
      // --------------------------------------------------------

      if (dto.dietTypeIds.length > 0) {
        await tx.insert(recipeDietTypes).values(
          dto.dietTypeIds.map((dietTypeId) => ({
            recipeId: recipe.id,
            dietTypeId,
          })),
        );
      }

      // --------------------------------------------------------
      // Allergens
      // --------------------------------------------------------

      if (dto.allergenIds.length > 0) {
        await tx.insert(recipeAllergens).values(
          dto.allergenIds.map((allergenId) => ({
            recipeId: recipe.id,
            allergenId,
          })),
        );
      }

      // --------------------------------------------------------
      // Foods
      // --------------------------------------------------------

      if (dto.foodIds.length > 0) {
        await tx.insert(recipeFoods).values(
          dto.foodIds.map((foodId) => ({
            recipeId: recipe.id,
            foodId,
          })),
        );
      }

      // --------------------------------------------------------
      // Nutrition
      // --------------------------------------------------------

      if (dto.nutrition) {
        await tx.insert(recipeNutrition).values({
          recipeId: recipe.id,
          calories: dto.nutrition.calories,
          protein: dto.nutrition.protein,
          carbohydrates: dto.nutrition.carbohydrates,
          fat: dto.nutrition.fat,
          fiber: dto.nutrition.fiber,
          sugar: dto.nutrition.sugar,
          sodium: dto.nutrition.sodium,
        });
      }

      return this.getRecipeById(recipe.id);
    });
  }

  // ============================================================
  // GET ONE
  // ============================================================

  async getRecipeById(recipeId: string) {
    const [recipe] = await db
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

    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    // ----------------------------------------------------------
    // Ingredients
    // ----------------------------------------------------------

    const recipeIngredientRows = await db
      .select({
        id: recipeIngredients.id,
        ingredientId: ingredients.id,
        ingredientName: ingredients.name,
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

    // ----------------------------------------------------------
    // Instructions
    // ----------------------------------------------------------

    const instructionRows = await db
      .select({
        id: recipeInstructions.id,
        stepNumber: recipeInstructions.stepNumber,
        instruction: recipeInstructions.instruction,
        recipeIngredientId: recipeInstructionIngredients.recipeIngredientId,
      })
      .from(recipeInstructions)
      .leftJoin(
        recipeInstructionIngredients,
        eq(recipeInstructions.id, recipeInstructionIngredients.instructionId),
      )
      .where(eq(recipeInstructions.recipeId, recipeId))
      .orderBy(asc(recipeInstructions.stepNumber));

    const instructions = instructionRows.reduce<
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
      }[]
    >((result, row) => {
      let instruction = result.find((item) => item.id === row.id);

      if (!instruction) {
        instruction = {
          id: row.id,
          stepNumber: row.stepNumber,
          instruction: row.instruction,
          ingredients: [],
        };

        result.push(instruction);
      }

      if (row.recipeIngredientId) {
        const ingredient = recipeIngredientRows.find(
          (item) => item.id === row.recipeIngredientId,
        );

        if (ingredient) {
          instruction.ingredients.push({
            id: ingredient.id,
            name: ingredient.ingredientName,
            quantity: ingredient.quantity,
            unit: ingredient.unit,
          });
        }
      }

      return result;
    }, []);

    // ----------------------------------------------------------
    // Categories
    // ----------------------------------------------------------

    const categories = await db
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

    // ----------------------------------------------------------
    // Diet types
    // ----------------------------------------------------------

    const dietTypesResult = await db
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

    // ----------------------------------------------------------
    // Allergens
    // ----------------------------------------------------------

    const allergensResult = await db
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

    // ----------------------------------------------------------
    // Foods
    // ----------------------------------------------------------

    const foodsResult = await db
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

    // ----------------------------------------------------------
    // Nutrition
    // ----------------------------------------------------------

    const [nutrition] = await db
      .select({
        calories: recipeNutrition.calories,
        protein: recipeNutrition.protein,
        carbohydrates: recipeNutrition.carbohydrates,
        fat: recipeNutrition.fat,
        fiber: recipeNutrition.fiber,
        sugar: recipeNutrition.sugar,
        sodium: recipeNutrition.sodium,
      })
      .from(recipeNutrition)
      .where(eq(recipeNutrition.recipeId, recipeId))
      .limit(1);

    // ----------------------------------------------------------
    // Final response
    // ----------------------------------------------------------

    return {
      ...recipe,

      nutrition: nutrition ?? null,

      ingredients: recipeIngredientRows,

      instructions,

      categories,

      dietTypes: dietTypesResult,

      allergens: allergensResult,

      foods: foodsResult,
    };
  }

  // ============================================================
  // GET MANY
  // ============================================================

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
          WHERE ${recipeCategoriesMap.recipeId}
            = ${recipes.id}
          AND ${recipeCategoriesMap.categoryId}
            = ${categoryId}
        )`,
      );
    }

    if (dietTypeId) {
      conditions.push(
        sql`EXISTS (
          SELECT 1
          FROM ${recipeDietTypes}
          WHERE ${recipeDietTypes.recipeId}
            = ${recipes.id}
          AND ${recipeDietTypes.dietTypeId}
            = ${dietTypeId}
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

  // ============================================================
  // UPDATE
  // ============================================================

  async updateRecipe(userId: string, recipeId: string, dto: UpdateRecipeDto) {
    await this.assertRecipeOwnership(userId, recipeId);

    await db.transaction(async (tx) => {
      // --------------------------------------------------------
      // Update basic recipe fields
      // --------------------------------------------------------

      const basicUpdates = {
        ...(dto.name !== undefined && {
          name: dto.name,
        }),

        ...(dto.description !== undefined && {
          description: dto.description,
        }),

        ...(dto.image !== undefined && {
          image: dto.image,
        }),

        ...(dto.cookingTime !== undefined && {
          cookingTime: dto.cookingTime,
        }),

        ...(dto.servings !== undefined && {
          servings: dto.servings,
        }),

        updatedAt: new Date(),
      };

      await tx
        .update(recipes)
        .set(basicUpdates)
        .where(eq(recipes.id, recipeId));

      // --------------------------------------------------------
      // Validate + replace ingredients/instructions
      // --------------------------------------------------------

      if (dto.ingredients !== undefined || dto.instructions !== undefined) {
        if (dto.ingredients === undefined || dto.instructions === undefined) {
          throw new ConflictException(
            'Ingredients and instructions must be provided together',
          );
        }

        const ingredientIds = dto.ingredients.map(
          (ingredient) => ingredient.ingredientId,
        );

        const existingIngredients = await tx
          .select({
            id: ingredients.id,
          })
          .from(ingredients)
          .where(inArray(ingredients.id, ingredientIds));

        if (existingIngredients.length !== ingredientIds.length) {
          throw new NotFoundException('One or more ingredients were not found');
        }

        const stepNumbers = dto.instructions.map(
          (instruction) => instruction.stepNumber,
        );

        if (new Set(stepNumbers).size !== stepNumbers.length) {
          throw new ConflictException(
            'Instruction step numbers must be unique',
          );
        }

        for (const instruction of dto.instructions) {
          for (const index of instruction.ingredientIndexes) {
            if (index < 0 || index >= dto.ingredients.length) {
              throw new ConflictException(
                `Invalid ingredient index ${index} in instruction step ${instruction.stepNumber}`,
              );
            }
          }
        }

        await tx.delete(recipeInstructionIngredients).where(
          inArray(
            recipeInstructionIngredients.instructionId,
            tx
              .select({
                id: recipeInstructions.id,
              })
              .from(recipeInstructions)
              .where(eq(recipeInstructions.recipeId, recipeId)),
          ),
        );

        await tx
          .delete(recipeInstructions)
          .where(eq(recipeInstructions.recipeId, recipeId));

        await tx
          .delete(recipeIngredients)
          .where(eq(recipeIngredients.recipeId, recipeId));

        const createdRecipeIngredients = await tx
          .insert(recipeIngredients)
          .values(
            dto.ingredients.map((ingredient) => ({
              recipeId,
              ingredientId: ingredient.ingredientId,
              quantity: ingredient.quantity,
              unit: ingredient.unit,
              preparation: ingredient.preparation,
              isOptional: ingredient.isOptional,
            })),
          )
          .returning({
            id: recipeIngredients.id,
          });

        const createdInstructions = await tx
          .insert(recipeInstructions)
          .values(
            dto.instructions.map((instruction) => ({
              recipeId,
              stepNumber: instruction.stepNumber,
              instruction: instruction.instruction,
            })),
          )
          .returning({
            id: recipeInstructions.id,
            stepNumber: recipeInstructions.stepNumber,
          });

        const mappings = [];

        for (const instruction of dto.instructions) {
          const createdInstruction = createdInstructions.find(
            (item) => item.stepNumber === instruction.stepNumber,
          );

          if (!createdInstruction) {
            throw new ConflictException(
              `Could not create instruction step ${instruction.stepNumber}`,
            );
          }

          for (const ingredientIndex of instruction.ingredientIndexes) {
            mappings.push({
              instructionId: createdInstruction.id,

              recipeIngredientId: createdRecipeIngredients[ingredientIndex].id,
            });
          }
        }

        if (mappings.length > 0) {
          await tx.insert(recipeInstructionIngredients).values(mappings);
        }
      }

      // --------------------------------------------------------
      // Categories
      // --------------------------------------------------------

      if (dto.categoryIds !== undefined) {
        if (dto.categoryIds.length > 0) {
          const existingCategories = await tx
            .select({
              id: recipeCategories.id,
            })
            .from(recipeCategories)
            .where(inArray(recipeCategories.id, dto.categoryIds));

          if (existingCategories.length !== dto.categoryIds.length) {
            throw new NotFoundException(
              'One or more categories were not found',
            );
          }
        }

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

      // --------------------------------------------------------
      // Diet types
      // --------------------------------------------------------

      if (dto.dietTypeIds !== undefined) {
        if (dto.dietTypeIds.length > 0) {
          const existingDietTypes = await tx
            .select({
              id: dietTypes.id,
            })
            .from(dietTypes)
            .where(inArray(dietTypes.id, dto.dietTypeIds));

          if (existingDietTypes.length !== dto.dietTypeIds.length) {
            throw new NotFoundException(
              'One or more diet types were not found',
            );
          }
        }

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

      // --------------------------------------------------------
      // Allergens
      // --------------------------------------------------------

      if (dto.allergenIds !== undefined) {
        if (dto.allergenIds.length > 0) {
          const existingAllergens = await tx
            .select({
              id: allergens.id,
            })
            .from(allergens)
            .where(inArray(allergens.id, dto.allergenIds));

          if (existingAllergens.length !== dto.allergenIds.length) {
            throw new NotFoundException('One or more allergens were not found');
          }
        }

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

      // --------------------------------------------------------
      // Foods
      // --------------------------------------------------------

      if (dto.foodIds !== undefined) {
        if (dto.foodIds.length > 0) {
          const existingFoods = await tx
            .select({
              id: foods.id,
            })
            .from(foods)
            .where(inArray(foods.id, dto.foodIds));

          if (existingFoods.length !== dto.foodIds.length) {
            throw new NotFoundException('One or more foods were not found');
          }
        }

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

      // --------------------------------------------------------
      // Nutrition
      // --------------------------------------------------------

      if (dto.nutrition !== undefined) {
        const [existingNutrition] = await tx
          .select({
            id: recipeNutrition.id,
          })
          .from(recipeNutrition)
          .where(eq(recipeNutrition.recipeId, recipeId))
          .limit(1);

        if (existingNutrition) {
          await tx
            .update(recipeNutrition)
            .set({
              calories: dto.nutrition.calories,
              protein: dto.nutrition.protein,
              carbohydrates: dto.nutrition.carbohydrates,
              fat: dto.nutrition.fat,
              fiber: dto.nutrition.fiber,
              sugar: dto.nutrition.sugar,
              sodium: dto.nutrition.sodium,
              updatedAt: new Date(),
            })
            .where(eq(recipeNutrition.id, existingNutrition.id));
        } else {
          await tx.insert(recipeNutrition).values({
            recipeId,

            calories: dto.nutrition.calories,

            protein: dto.nutrition.protein,

            carbohydrates: dto.nutrition.carbohydrates,

            fat: dto.nutrition.fat,

            fiber: dto.nutrition.fiber,

            sugar: dto.nutrition.sugar,

            sodium: dto.nutrition.sodium,
          });
        }
      }
    });

    // Transaction has committed here.
    return this.getRecipeById(recipeId);
  }

  // ============================================================
  // DELETE
  // ============================================================

  async deleteRecipe(userId: string, recipeId: string) {
    await this.assertRecipeOwnership(userId, recipeId);

    await db.delete(recipes).where(eq(recipes.id, recipeId));

    return null;
  }

  // ============================================================
  // OWNERSHIP
  // ============================================================

  private async assertRecipeOwnership(userId: string, recipeId: string) {
    const [recipe] = await db
      .select({
        id: recipes.id,
        createdBy: recipes.createdBy,
      })
      .from(recipes)
      .where(eq(recipes.id, recipeId))
      .limit(1);

    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    if (recipe.createdBy !== userId) {
      throw new ConflictException('You can only modify recipes created by you');
    }

    return recipe;
  }
}
