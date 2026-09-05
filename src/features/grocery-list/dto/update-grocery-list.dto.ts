import { PartialType } from '@nestjs/swagger';
import { CreateGroceryListDto } from './create-grocery-list.dto.js';

export class UpdateGroceryListDto extends PartialType(CreateGroceryListDto) {}
