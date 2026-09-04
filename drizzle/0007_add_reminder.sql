CREATE TYPE "public"."reminder_day" AS ENUM(
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY'
);--> statement-breakpoint

ALTER TABLE "user_preferences"
ADD COLUMN "reminder_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint

ALTER TABLE "user_preferences"
ADD COLUMN "reminder_day" "reminder_day";--> statement-breakpoint

ALTER TABLE "user_preferences"
ADD COLUMN "reminder_time" time;
