CREATE TABLE "request_issue_months" (
	"month" text NOT NULL,
	"route" text NOT NULL,
	"kind" text NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"total_ms" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "request_issue_months_month_route_kind_pk" PRIMARY KEY("month","route","kind")
);
--> statement-breakpoint
ALTER TABLE "request_issue_months" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "request_issues" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"method" text NOT NULL,
	"route" text NOT NULL,
	"status" integer NOT NULL,
	"ms" integer NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "request_issues" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "search_counts" (
	"period" text NOT NULL,
	"term" text NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "search_counts_period_term_pk" PRIMARY KEY("period","term")
);
--> statement-breakpoint
ALTER TABLE "search_counts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "people" ADD COLUMN "signup_source" text;--> statement-breakpoint
ALTER TABLE "people" ADD COLUMN "signup_campaign" text;--> statement-breakpoint
CREATE INDEX "request_issues_at_index" ON "request_issues" USING btree ("at");