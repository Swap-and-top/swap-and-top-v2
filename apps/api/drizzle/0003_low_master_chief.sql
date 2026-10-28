CREATE TABLE "listing_views" (
	"id" text PRIMARY KEY NOT NULL,
	"listing_id" text NOT NULL,
	"device_hash" text NOT NULL,
	"viewed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "listing_views" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "listing_views" ADD CONSTRAINT "listing_views_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "listing_views_listing_id_viewed_at_index" ON "listing_views" USING btree ("listing_id","viewed_at");--> statement-breakpoint
CREATE INDEX "listing_views_device_hash_viewed_at_index" ON "listing_views" USING btree ("device_hash","viewed_at");