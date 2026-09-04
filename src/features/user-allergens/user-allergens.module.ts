import { Module } from '@nestjs/common';
import { UserAllergensService } from './user-allergens.service.js';
import { UserAllergensController } from './user-allergens.controller.js';

@Module({
  controllers: [UserAllergensController],
  providers: [UserAllergensService],
  exports: [UserAllergensService],
})
export class UserAllergensModule {}
