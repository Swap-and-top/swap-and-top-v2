CREATE TABLE "staff_log" (
	"id" text PRIMARY KEY NOT NULL,
	"actor_id" text NOT NULL,
	"action" text NOT NULL,
	"target_person_id" text,
	"detail" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "staff_log" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "staff_log" ADD CONSTRAINT "staff_log_actor_id_people_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."people"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_log" ADD CONSTRAINT "staff_log_target_person_id_people_id_fk" FOREIGN KEY ("target_person_id") REFERENCES "public"."people"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "staff_log_created_at_index" ON "staff_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "staff_log_target_person_id_created_at_index" ON "staff_log" USING btree ("target_person_id","created_at");--> statement-breakpoint
CREATE INDEX "staff_log_actor_id_created_at_index" ON "staff_log" USING btree ("actor_id","created_at");