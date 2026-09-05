import { PartialType } from '@nestjs/swagger';
import { CreateGroceryItemDto } from './create-grocery-item.dto.js';

export class UpdateGroceryItemDto extends PartialType(CreateGroceryItemDto) {}
