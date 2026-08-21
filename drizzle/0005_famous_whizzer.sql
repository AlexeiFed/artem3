ALTER TABLE "leads" ADD COLUMN "consent_document_version" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "consent_checkbox_text" text DEFAULT '' NOT NULL;