CREATE TABLE "staff_overview_cards" (
	"person_id" text PRIMARY KEY NOT NULL,
	"cards" text[] DEFAULT '{}' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "staff_overview_cards" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "staff_overview_cards" ADD CONSTRAINT "staff_overview_cards_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE no action ON UPDATE no action;