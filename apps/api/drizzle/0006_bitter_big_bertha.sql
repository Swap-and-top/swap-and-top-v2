CREATE TABLE "store_contacts" (
	"id" text PRIMARY KEY NOT NULL,
	"store_id" text NOT NULL,
	"viewer_id" text,
	"device_hash" text NOT NULL,
	"address_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "store_contacts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "reveals" ADD COLUMN "address_hash" text;--> statement-breakpoint
ALTER TABLE "store_contacts" ADD CONSTRAINT "store_contacts_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_contacts" ADD CONSTRAINT "store_contacts_viewer_id_people_id_fk" FOREIGN KEY ("viewer_id") REFERENCES "public"."people"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "store_contacts_store_id_index" ON "store_contacts" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "store_contacts_device_hash_created_at_index" ON "store_contacts" USING btree ("device_hash","created_at");--> statement-breakpoint
CREATE INDEX "store_contacts_address_hash_created_at_index" ON "store_contacts" USING btree ("address_hash","created_at");--> statement-breakpoint
CREATE INDEX "store_contacts_viewer_id_created_at_index" ON "store_contacts" USING btree ("viewer_id","created_at");--> statement-breakpoint
CREATE INDEX "reveals_address_hash_created_at_index" ON "reveals" USING btree ("address_hash","created_at");