import { IsBoolean, IsIn } from 'class-validator';

export class UpdateUserPreferencesDto {
  @IsIn(['2', '4', '6', '8'])
  defaultServings: '2' | '4' | '6' | '8';

  @IsBoolean()
  onboardingCompleted: boolean;
}
