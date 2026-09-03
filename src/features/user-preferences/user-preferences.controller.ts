import { Controller } from '@nestjs/common';
import { UserPreferencesService } from './user-preferences.service.js';

@Controller('user-preferences')
export class UserPreferencesController {
  constructor(
    private readonly userPreferencesService: UserPreferencesService,
  ) {}
}
