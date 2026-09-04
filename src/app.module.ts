import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { auth } from './lib/index.js';
import { UserPreferencesModule } from './features/user-preferences/user-preferences.module.js';
import { DietTypesModule } from './features/diet-types/diet-types.module.js';
import { UserDietTypesModule } from './features/user-diet-types/user-diet-types.module.js';
import { UserAllergensModule } from './features/user-allergens/user-allergens.module.js';
import { AllergensModule } from './features/allergens/allergens.module.js';
import { FoodsModule } from './features/foods/foods.module.js';
import { UserDislikedFoodsModule } from './features/user-disliked-foods/user-disliked-foods.module.js';

@Module({
  imports: [
    AuthModule.forRoot({ auth }),
    UserPreferencesModule,
    DietTypesModule,
    UserDietTypesModule,
    UserAllergensModule,
    AllergensModule,
    FoodsModule,
    UserDislikedFoodsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
