import { Module } from '@nestjs/common';
import { RecipeFeedbackService } from './recipe-feedback.service.js';
import { RecipeFeedbackController } from './recipe-feedback.controller.js';

@Module({
  controllers: [RecipeFeedbackController],
  providers: [RecipeFeedbackService],
  exports: [RecipeFeedbackService],
})
export class RecipeFeedbackModule {}
