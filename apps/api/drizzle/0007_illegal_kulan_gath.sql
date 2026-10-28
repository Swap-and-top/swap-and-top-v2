CREATE TYPE "public"."staff_department" AS ENUM('trust_safety', 'sales', 'finance', 'marketing', 'devops', 'executives', 'board');--> statement-breakpoint
CREATE TABLE "staff_departments" (
	"person_id" text NOT NULL,
	"department" "staff_department" NOT NULL,
	"lead" boolean DEFAULT false NOT NULL,
	"added_by_id" text,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "staff_departments_person_id_department_pk" PRIMARY KEY("person_id","department")
);
--> statement-breakpoint
ALTER TABLE "staff_departments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "people" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "people" ALTER COLUMN "role" SET DEFAULT 'user'::text;--> statement-breakpoint
-- Moderators become Trust and safety members and admins its leads (P40),
-- then both are ordinary users, before the role narrows to user or super admin.
INSERT INTO "staff_departments" ("person_id", "department", "lead") SELECT "id", 'trust_safety', "role" = 'admin' FROM "people" WHERE "role" IN ('moderator', 'admin');--> statement-breakpoint
UPDATE "people" SET "role" = 'user' WHERE "role" IN ('moderator', 'admin');--> statement-breakpoint
DROP TYPE "public"."role";--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'super_admin');--> statement-breakpoint
ALTER TABLE "people" ALTER COLUMN "role" SET DEFAULT 'user'::"public"."role";--> statement-breakpoint
ALTER TABLE "people" ALTER COLUMN "role" SET DATA TYPE "public"."role" USING "role"::"public"."role";--> statement-breakpoint
ALTER TABLE "staff_departments" ADD CONSTRAINT "staff_departments_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_departments" ADD CONSTRAINT "staff_departments_added_by_id_people_id_fk" FOREIGN KEY ("added_by_id") REFERENCES "public"."people"("id") ON DELETE no action ON UPDATE no action;