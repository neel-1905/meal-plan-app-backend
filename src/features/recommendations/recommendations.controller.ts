import { Controller, Get, Query } from '@nestjs/common';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';

import { ResponseMessage } from '../../common/http/decorators/response-message.decorator.js';

import { RecommendationsService } from './recommendations.service.js';

@Controller('recommendations')
export class RecommendationsController {
  constructor(
    private readonly recommendationsService: RecommendationsService,
  ) {}

  @Get()
  @ResponseMessage('Recommended recipes fetched successfully')
  getRecommendedRecipes(
    @Session() session: UserSession,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? Number(limit) : 10;

    return this.recommendationsService.getRecommendedRecipes(
      session.user.id,
      parsedLimit,
    );
  }
}
