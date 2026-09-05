CREATE TABLE "recipe_instruction_ingredients" (
	"instruction_id" uuid NOT NULL,
	"recipe_ingredient_id" uuid NOT NULL,
	CONSTRAINT "recipe_instruction_ingredients_instruction_id_recipe_ingredient_id_pk" PRIMARY KEY("instruction_id","recipe_ingredient_id")
);
--> statement-breakpoint
CREATE TABLE "recipe_instructions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipe_id" uuid NOT NULL,
	"step_number" integer NOT NULL,
	"instruction" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "recipe_instruction_ingredients" ADD CONSTRAINT "recipe_instruction_ingredients_instruction_id_recipe_instructions_id_fk" FOREIGN KEY ("instruction_id") REFERENCES "public"."recipe_instructions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_instruction_ingredients" ADD CONSTRAINT "recipe_instruction_ingredients_recipe_ingredient_id_recipe_ingredients_id_fk" FOREIGN KEY ("recipe_ingredient_id") REFERENCES "public"."recipe_ingredients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_instructions" ADD CONSTRAINT "recipe_instructions_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;