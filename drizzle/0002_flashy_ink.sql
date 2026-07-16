ALTER TABLE "leads" ADD COLUMN "is_data_agreed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "is_marketing_agreed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "consent_at" timestamp with time zone DEFAULT now() NOT NULL;