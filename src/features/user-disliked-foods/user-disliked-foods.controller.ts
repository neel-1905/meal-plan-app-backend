import { Body, Controller, Get, Put, Session } from '@nestjs/common';
import { UserDislikedFoodsService } from './user-disliked-foods.service.js';
import { ResponseMessage } from '../../common/http/decorators/response-message.decorator.js';
import { type UserSession } from '@thallesp/nestjs-better-auth';
import { UpdateUserDislikedFoodsDto } from './dto/update-user-disliked-foods.dto.js';

@Controller('user-disliked-foods')
export class UserDislikedFoodsController {
  constructor(
    private readonly userDislikedFoodsService: UserDislikedFoodsService,
  ) {}

  @Get()
  @ResponseMessage('Disliked foods fetched successfully')
  getUserDislikedFoods(@Session() session: UserSession) {
    return this.userDislikedFoodsService.getUserDislikedFoods(session.user.id);
  }

  @Put()
  @ResponseMessage('Disliked foods updated successfully')
  updateUserDislikedFoods(
    @Session() session: UserSession,
    @Body() dto: UpdateUserDislikedFoodsDto,
  ) {
    return this.userDislikedFoodsService.updateUserDislikedFoods(
      session.user.id,
      dto,
    );
  }
}
