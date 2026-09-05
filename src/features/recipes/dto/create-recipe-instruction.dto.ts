import { IsInt, IsString, Min } from 'class-validator';

export class CreateRecipeInstructionDto {
  @IsInt()
  @Min(1)
  stepNumber: number;

  @IsString()
  instruction: string;

  @IsInt({ each: true })
  @Min(0, { each: true })
  ingredientIndexes: number[];
}
