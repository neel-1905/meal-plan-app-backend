CREATE TABLE "user_disliked_foods" (
	"user_id" text NOT NULL,
	"food_id" uuid NOT NULL,
	CONSTRAINT "user_disliked_foods_user_id_food_id_pk" PRIMARY KEY("user_id","food_id")
);
--> statement-breakpoint
ALTER TABLE "user_disliked_foods" ADD CONSTRAINT "user_disliked_foods_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_disliked_foods" ADD CONSTRAINT "user_disliked_foods_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE cascade ON UPDATE no action;