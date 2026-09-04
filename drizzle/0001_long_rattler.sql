CREATE TYPE "public"."serving_size" AS ENUM('2', '4', '6', '8');--> statement-breakpoint
CREATE TABLE "allergens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "allergens_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "diet_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "diet_types_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "foods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "foods_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "user_diet_types" (
	"user_id" text NOT NULL,
	"diet_type_id" uuid NOT NULL,
	CONSTRAINT "user_diet_types_user_id_diet_type_id_pk" PRIMARY KEY("user_id","diet_type_id")
);
--> statement-breakpoint
CREATE TABLE "user_food_preferences" (
	"user_id" text NOT NULL,
	"food_id" uuid NOT NULL,
	"preference" text NOT NULL,
	CONSTRAINT "user_food_preferences_user_id_food_id_pk" PRIMARY KEY("user_id","food_id")
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"default_servings" integer NOT NULL,
	"onboarding_completed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "user_diet_types" ADD CONSTRAINT "user_diet_types_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_diet_types" ADD CONSTRAINT "user_diet_types_diet_type_id_diet_types_id_fk" FOREIGN KEY ("diet_type_id") REFERENCES "public"."diet_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_food_preferences" ADD CONSTRAINT "user_food_preferences_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_food_preferences" ADD CONSTRAINT "user_food_preferences_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;