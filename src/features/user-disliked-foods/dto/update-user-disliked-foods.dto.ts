import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class UpdateUserDislikedFoodsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  foodIds: string[];
}
