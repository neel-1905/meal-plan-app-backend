import { BadRequestException, Injectable } from '@nestjs/common';
import { inArray } from 'drizzle-orm';

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
}
