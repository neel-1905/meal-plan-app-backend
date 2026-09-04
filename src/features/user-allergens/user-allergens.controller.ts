import { Body, Controller, Get, Put, Session } from '@nestjs/common';
import { UserAllergensService } from './user-allergens.service.js';
import { ResponseMessage } from '../../common/http/decorators/response-message.decorator.js';
import { type UserSession } from '@thallesp/nestjs-better-auth';
import { UpdateUserAllergensDto } from './dto/update-user-allergens.dto.js';

@Controller('user-allergens')
export class UserAllergensController {
  constructor(private readonly userAllergensService: UserAllergensService) {}

  @Get()
  @ResponseMessage('User allergies fetched successfully')
  getUserAllergens(@Session() session: UserSession) {
    return this.userAllergensService.getUserAllergens(session.user.id);
  }

  @Put()
  @ResponseMessage('User allergies updated successfully')
  updateUserAllergens(
    @Session() session: UserSession,
    @Body() dto: UpdateUserAllergensDto,
  ) {
    return this.userAllergensService.updateUserAllergens(session.user.id, dto);
  }
}
