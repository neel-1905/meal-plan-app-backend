import { Controller, Get } from '@nestjs/common';
import { DietTypesService } from './diet-types.service.js';
import { ResponseMessage } from '../../common/http/decorators/response-message.decorator.js';

@Controller('diet-types')
export class DietTypesController {
  constructor(private readonly dietTypesService: DietTypesService) {}

  @Get()
  @ResponseMessage('Diet types fetched successfully')
  getDietTypes() {
    return this.dietTypesService.getDietTypes();
  }
}
