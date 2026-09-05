CREATE TABLE "recipe_categories_map" (
	"recipe_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	CONSTRAINT "recipe_categories_map_recipe_id_category_id_pk" PRIMARY KEY("recipe_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "recipe_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "recipe_categories_code_unique" UNIQUE("code"),
	CONSTRAINT "recipe_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "recipe_categories_map" ADD CONSTRAINT "recipe_categories_map_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_categories_map" ADD CONSTRAINT "recipe_categories_map_category_id_recipe_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."recipe_categories"("id") ON DELETE cascade ON UPDATE no action;