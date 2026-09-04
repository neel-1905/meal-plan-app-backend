import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { auth } from './lib/index.js';
import { UserPreferencesModule } from './features/user-preferences/user-preferences.module.js';

@Module({
  imports: [AuthModule.forRoot({ auth }), UserPreferencesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
