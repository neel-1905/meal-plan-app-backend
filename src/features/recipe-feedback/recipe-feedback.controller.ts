import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { Session, type UserSession } from '@thallesp/nestjs-better-auth';

import { ResponseMessage } from '../../common/http/decorators/response-message.decorator.js';

import { CreateRecipeFeedbackDto } from './dto/create-recipe-feedback.dto.js';
import { UpdateRecipeFeedbackDto } from './dto/update-recipe-feedback.dto.js';
import { RecipeFeedbackService } from './recipe-feedback.service.js';

@Controller('recipes/:recipeId/feedback')
export class RecipeFeedbackController {
  constructor(private readonly recipeFeedbackService: RecipeFeedbackService) {}

  @Post()
  @ResponseMessage('Recipe feedback created successfully')
  createFeedback(
    @Session() session: UserSession,
    @Param('recipeId') recipeId: string,
    @Body() dto: CreateRecipeFeedbackDto,
  ) {
    return this.recipeFeedbackService.createFeedback(
      session.user.id,
      recipeId,
      dto,
    );
  }

  @Get()
  @ResponseMessage('Recipe feedback fetched successfully')
  getRecipeFeedback(@Param('recipeId') recipeId: string) {
    return this.recipeFeedbackService.getRecipeFeedback(recipeId);
  }

  @Get('summary')
  @ResponseMessage('Recipe feedback summary fetched successfully')
  getRecipeFeedbackSummary(@Param('recipeId') recipeId: string) {
    return this.recipeFeedbackService.getRecipeFeedbackSummary(recipeId);
  }

  @Get('me')
  @ResponseMessage('Your recipe feedback fetched successfully')
  getMyFeedback(
    @Session() session: UserSession,
    @Param('recipeId') recipeId: string,
  ) {
    return this.recipeFeedbackService.getMyFeedback(session.user.id, recipeId);
  }

  @Patch()
  @ResponseMessage('Recipe feedback updated successfully')
  updateFeedback(
    @Session() session: UserSession,
    @Param('recipeId') recipeId: string,
    @Body() dto: UpdateRecipeFeedbackDto,
  ) {
    return this.recipeFeedbackService.updateFeedback(
      session.user.id,
      recipeId,
      dto,
    );
  }

  @Delete()
  @ResponseMessage('Recipe feedback deleted successfully')
  deleteFeedback(
    @Session() session: UserSession,
    @Param('recipeId') recipeId: string,
  ) {
    return this.recipeFeedbackService.deleteFeedback(session.user.id, recipeId);
  }
}
