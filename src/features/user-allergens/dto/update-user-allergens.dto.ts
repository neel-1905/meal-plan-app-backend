import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class UpdateUserAllergensDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  allergenIds: string[];
}
