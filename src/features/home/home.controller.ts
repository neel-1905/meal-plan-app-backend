import { Controller, Get, Session } from '@nestjs/common';
import { HomeService } from './home.service.js';
import { ResponseMessage } from '../../common/http/decorators/response-message.decorator.js';
import { type UserSession } from '@thallesp/nestjs-better-auth';

@Controller('home')
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  @Get()
  @ResponseMessage('Home data fetched successfully')
  getHome(@Session() session: UserSession) {
    return this.homeService.getHome(session.user.id);
  }
}
