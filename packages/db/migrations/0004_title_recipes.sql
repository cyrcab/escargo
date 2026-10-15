ALTER TABLE "titles" ADD COLUMN "category" text NOT NULL;--> statement-breakpoint
ALTER TABLE "titles" ADD COLUMN "recipe" jsonb NOT NULL;