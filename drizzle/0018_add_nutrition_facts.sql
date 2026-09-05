CREATE TABLE "recipe_nutrition" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipe_id" uuid NOT NULL,
	"calories" numeric(10, 2),
	"protein" numeric(10, 2),
	"carbohydrates" numeric(10, 2),
	"fat" numeric(10, 2),
	"fiber" numeric(10, 2),
	"sugar" numeric(10, 2),
	"sodium" numeric(10, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "recipe_nutrition_recipe_id_unique" UNIQUE("recipe_id")
);
--> statement-breakpoint
ALTER TABLE "recipe_nutrition" ADD CONSTRAINT "recipe_nutrition_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;