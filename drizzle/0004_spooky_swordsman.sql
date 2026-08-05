ALTER TABLE "services" ADD COLUMN "is_hidden" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "cta_label" text DEFAULT 'Получить оценку ситуации' NOT NULL;