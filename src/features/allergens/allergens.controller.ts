import { Controller, Get } from '@nestjs/common';
import { AllergensService } from './allergens.service.js';
import { ResponseMessage } from '../../common/http/decorators/response-message.decorator.js';

@Controller('allergens')
export class AllergensController {
  constructor(private readonly allergensService: AllergensService) {}

  @Get()
  @ResponseMessage('Allergens fetched successfully')
  getAllergens() {
    return this.allergensService.getAllergens();
  }
}
