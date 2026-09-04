import { Module } from '@nestjs/common';
import { UserDietTypesService } from './user-diet-types.service.js';
import { UserDietTypesController } from './user-diet-types.controller.js';

@Module({
  controllers: [UserDietTypesController],
  providers: [UserDietTypesService],
  exports: [UserDietTypesService],
})
export class UserDietTypesModule {}
