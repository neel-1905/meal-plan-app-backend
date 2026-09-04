import { Body, Controller, Get, Put } from '@nestjs/common';
import { UserPreferencesService } from './user-preferences.service.js';
import { ResponseMessage } from '../../common/http/decorators/response-message.decorator.js';
import { UpdateUserPreferencesDto } from './dto/update-user-preferences.dto.js';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';

@Controller('user-preferences')
export class UserPreferencesController {
  constructor(
    private readonly userPreferencesService: UserPreferencesService,
  ) {}

  @Get()
  @ResponseMessage('User preferences fetched successfully')
  getPreferences(@Session() session: UserSession) {
    return this.userPreferencesService.getPreferences(session.user.id);
  }

  @Put()
  @ResponseMessage('User preferences updated successfully')
  updatePreferences(
    @Session() session: UserSession,
    @Body() dto: UpdateUserPreferencesDto,
  ) {
    return this.userPreferencesService.updatePreferences(session.user.id, dto);
  }
}
