import { PartialType } from '@nestjs/swagger';
import { CreateRecipeFeedbackDto } from './create-recipe-feedback.dto.js';

export class UpdateRecipeFeedbackDto extends PartialType(
  CreateRecipeFeedbackDto,
) {}
