import { Module } from '@nestjs/common';
import { AllergensService } from './allergens.service.js';
import { AllergensController } from './allergens.controller.js';

@Module({
  controllers: [AllergensController],
  providers: [AllergensService],
  exports: [AllergensService],
})
export class AllergensModule {}
