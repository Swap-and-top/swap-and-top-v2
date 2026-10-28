CREATE TYPE "public"."verification_kind" AS ENUM('registered', 'informal');--> statement-breakpoint
CREATE TYPE "public"."verification_state" AS ENUM('pending', 'approved', 'declined');--> statement-breakpoint
CREATE TABLE "verification_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"store_id" text NOT NULL,
	"requested_by_id" text NOT NULL,
	"kind" "verification_kind" NOT NULL,
	"reference" text NOT NULL,
	"state" "verification_state" DEFAULT 'pending' NOT NULL,
	"note" text,
	"decided_by_id" text,
	"decided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "verification_requests" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "verification_requests" ADD CONSTRAINT "verification_requests_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_requests" ADD CONSTRAINT "verification_requests_requested_by_id_people_id_fk" FOREIGN KEY ("requested_by_id") REFERENCES "public"."people"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_requests" ADD CONSTRAINT "verification_requests_decided_by_id_people_id_fk" FOREIGN KEY ("decided_by_id") REFERENCES "public"."people"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "verification_requests_store_id_created_at_index" ON "verification_requests" USING btree ("store_id","created_at");--> statement-breakpoint
CREATE INDEX "verification_requests_state_index" ON "verification_requests" USING btree ("state");