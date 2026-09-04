import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class UpdateUserDietTypesDto {
  @IsArray()
  // @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  dietTypeIds: string[];
}
