CREATE TYPE "public"."lead_status" AS ENUM('NEW', 'IN_PROGRESS', 'CLOSED');--> statement-breakpoint
CREATE TABLE "admin_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"last_activity_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_sessions_token_hash_unique" UNIQUE("token_hash"),
	CONSTRAINT "admin_sessions_token_hash_sha256_check" CHECK ("admin_sessions"."token_hash" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "admin_sessions_expiry_after_creation_check" CHECK ("admin_sessions"."expires_at" > "admin_sessions"."created_at")
);
--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_users_email_unique" UNIQUE("email"),
	CONSTRAINT "admin_users_email_normalized_check" CHECK ("admin_users"."email" = lower(trim("admin_users"."email"))),
	CONSTRAINT "admin_users_password_hash_nonempty_check" CHECK (length("admin_users"."password_hash") > 0)
);
--> statement-breakpoint
CREATE TABLE "cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"situation" text NOT NULL,
	"action" text NOT NULL,
	"result" text NOT NULL,
	"sort_order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cases_sort_order_unique" UNIQUE("sort_order"),
	CONSTRAINT "cases_sort_order_nonnegative_check" CHECK ("cases"."sort_order" >= 0)
);
--> statement-breakpoint
CREATE TABLE "certificates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"image_url" text NOT NULL,
	"alt_text" text NOT NULL,
	"sort_order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "certificates_sort_order_unique" UNIQUE("sort_order"),
	CONSTRAINT "certificates_sort_order_nonnegative_check" CHECK ("certificates"."sort_order" >= 0)
);
--> statement-breakpoint
CREATE TABLE "faqs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"sort_order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "faqs_sort_order_unique" UNIQUE("sort_order"),
	CONSTRAINT "faqs_sort_order_nonnegative_check" CHECK ("faqs"."sort_order" >= 0)
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"author" text NOT NULL,
	"quote" text NOT NULL,
	"image_url" text,
	"source" text NOT NULL,
	"source_url" text NOT NULL,
	"sort_order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reviews_sort_order_unique" UNIQUE("sort_order"),
	CONSTRAINT "reviews_sort_order_nonnegative_check" CHECK ("reviews"."sort_order" >= 0)
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"situations" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"trust_note" text NOT NULL,
	"price_from_kopecks" integer NOT NULL,
	"is_high_value" boolean DEFAULT false NOT NULL,
	"sort_order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "services_slug_unique" UNIQUE("slug"),
	CONSTRAINT "services_sort_order_unique" UNIQUE("sort_order"),
	CONSTRAINT "services_price_from_kopecks_nonnegative_check" CHECK ("services"."price_from_kopecks" >= 0),
	CONSTRAINT "services_sort_order_nonnegative_check" CHECK ("services"."sort_order" >= 0)
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"id" text PRIMARY KEY DEFAULT 'default' NOT NULL,
	"hero" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"trust_banner" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"workflow" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"contacts" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"legal" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"map" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ratings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"vk_embed" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "site_settings_singleton_check" CHECK ("site_settings"."id" = 'default')
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"situation" text,
	"service_id" uuid,
	"status" "lead_status" DEFAULT 'NEW' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "leads_name_nonempty_check" CHECK (length(trim("leads"."name")) > 0),
	CONSTRAINT "leads_phone_normalized_check" CHECK ("leads"."phone" ~ '^\+[1-9][0-9]{7,14}$')
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"hashed_key" text NOT NULL,
	"action" text NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"count" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "rate_limits_key_action_window_pk" PRIMARY KEY("hashed_key","action","window_start"),
	CONSTRAINT "rate_limits_hashed_key_sha256_check" CHECK ("rate_limits"."hashed_key" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "rate_limits_action_nonempty_check" CHECK (length("rate_limits"."action") > 0),
	CONSTRAINT "rate_limits_count_positive_check" CHECK ("rate_limits"."count" > 0)
);
--> statement-breakpoint
CREATE TABLE "media_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"object_key" text NOT NULL,
	"url" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" bigint NOT NULL,
	"alt_text" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "media_assets_object_key_unique" UNIQUE("object_key"),
	CONSTRAINT "media_assets_object_key_nonempty_check" CHECK (length("media_assets"."object_key") > 0),
	CONSTRAINT "media_assets_mime_type_nonempty_check" CHECK (length("media_assets"."mime_type") > 0),
	CONSTRAINT "media_assets_size_nonnegative_check" CHECK ("media_assets"."size_bytes" >= 0)
);
--> statement-breakpoint
ALTER TABLE "admin_sessions" ADD CONSTRAINT "admin_sessions_user_id_admin_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."admin_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_sessions_user_id_idx" ON "admin_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "admin_sessions_expires_at_idx" ON "admin_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "leads_service_id_idx" ON "leads" USING btree ("service_id");--> statement-breakpoint
CREATE INDEX "leads_status_idx" ON "leads" USING btree ("status");--> statement-breakpoint
CREATE INDEX "leads_created_at_idx" ON "leads" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "rate_limits_window_start_idx" ON "rate_limits" USING btree ("window_start");