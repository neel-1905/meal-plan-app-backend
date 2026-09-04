import { Body, Controller, Get, Put, Session } from '@nestjs/common';
import { UserDietTypesService } from './user-diet-types.service.js';
import { ResponseMessage } from '../../common/http/decorators/response-message.decorator.js';
import { type UserSession } from '@thallesp/nestjs-better-auth';
import { UpdateUserDietTypesDto } from './dto/update-user-diet-types.dto.js';

@Controller('user-diet-types')
export class UserDietTypesController {
  constructor(private readonly userDietTypesService: UserDietTypesService) {}

  @Get()
  @ResponseMessage('User diet types fetched successfully')
  getUserDietTypes(@Session() session: UserSession) {
    return this.userDietTypesService.getUserDietTypes(session.user.id);
  }

  @Put()
  @ResponseMessage('User diet types updated successfully')
  updateUserDietTypes(
    @Session() session: UserSession,
    @Body() dto: UpdateUserDietTypesDto,
  ) {
    return this.userDietTypesService.updateUserDietTypes(session.user.id, dto);
  }
}
