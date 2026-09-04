import { Module } from '@nestjs/common';
import { DietTypesService } from './diet-types.service.js';
import { DietTypesController } from './diet-types.controller.js';

@Module({
  controllers: [DietTypesController],
  providers: [DietTypesService],
  exports: [DietTypesService],
})
export class DietTypesModule {}
