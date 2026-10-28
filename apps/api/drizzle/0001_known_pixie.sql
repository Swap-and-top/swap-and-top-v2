ALTER TABLE "listings" ADD COLUMN "paused_by_lapse" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "store_passes" ADD COLUMN "reminder_sent_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "store_passes" ADD COLUMN "lapse_handled_at" timestamp with time zone;