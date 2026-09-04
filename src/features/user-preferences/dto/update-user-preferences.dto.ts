import { IsBoolean, IsEnum, IsIn, IsOptional, Matches } from 'class-validator';

export enum ServingSize {
  TWO = '2',
  FOUR = '4',
  SIX = '6',
  EIGHT = '8',
}

export enum ReminderDay {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY',
}

export class UpdateUserPreferencesDto {
  @IsEnum(ServingSize)
  defaultServings: ServingSize;

  @IsBoolean()
  onboardingCompleted: boolean;

  @IsBoolean()
  reminderEnabled: boolean;

  @IsOptional()
  @IsEnum(ReminderDay)
  reminderDay?: ReminderDay;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  reminderTime?: string;
}
