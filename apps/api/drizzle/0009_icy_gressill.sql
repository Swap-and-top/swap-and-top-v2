CREATE TYPE "public"."lead_match" AS ENUM('stock', 'categories');--> statement-breakpoint
CREATE TABLE "store_lead_settings" (
	"store_id" text PRIMARY KEY NOT NULL,
	"match" "lead_match" DEFAULT 'stock' NOT NULL,
	"categories" "category"[] DEFAULT '{}' NOT NULL,
	"alerts" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "store_lead_settings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "store_lead_settings" ADD CONSTRAINT "store_lead_settings_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;