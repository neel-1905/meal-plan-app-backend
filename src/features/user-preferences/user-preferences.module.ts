import { Module } from '@nestjs/common';
import { UserPreferencesService } from './user-preferences.service.js';
import { UserPreferencesController } from './user-preferences.controller.js';

@Module({
  controllers: [UserPreferencesController],
  providers: [UserPreferencesService],
  exports: [UserPreferencesService],
})
export class UserPreferencesModule {}
