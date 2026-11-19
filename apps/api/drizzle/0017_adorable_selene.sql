ALTER TYPE "public"."notification_kind" ADD VALUE 'message';--> statement-breakpoint
ALTER TYPE "public"."report_reason" ADD VALUE 'asking-money-first' BEFORE 'other';--> statement-breakpoint
ALTER TYPE "public"."report_reason" ADD VALUE 'abusive-messages' BEFORE 'other';--> statement-breakpoint
CREATE TABLE "chat_blocks" (
	"blocker_id" text NOT NULL,
	"blocked_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chat_blocks_blocker_id_blocked_id_pk" PRIMARY KEY("blocker_id","blocked_id")
);
--> statement-breakpoint
ALTER TABLE "chat_blocks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"chat_id" text NOT NULL,
	"sender_person_id" text,
	"sender_store_id" text,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"read_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "chat_messages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "chats" (
	"id" text PRIMARY KEY NOT NULL,
	"listing_id" text NOT NULL,
	"offer_id" text,
	"from_person_id" text NOT NULL,
	"from_store_id" text,
	"owner_person_id" text NOT NULL,
	"owner_store_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_message_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "chats" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "chat_id" text;--> statement-breakpoint
ALTER TABLE "chat_blocks" ADD CONSTRAINT "chat_blocks_blocker_id_people_id_fk" FOREIGN KEY ("blocker_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_blocks" ADD CONSTRAINT "chat_blocks_blocked_id_people_id_fk" FOREIGN KEY ("blocked_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sender_person_id_people_id_fk" FOREIGN KEY ("sender_person_id") REFERENCES "public"."people"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sender_store_id_stores_id_fk" FOREIGN KEY ("sender_store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chats" ADD CONSTRAINT "chats_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chats" ADD CONSTRAINT "chats_offer_id_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chats" ADD CONSTRAINT "chats_from_person_id_people_id_fk" FOREIGN KEY ("from_person_id") REFERENCES "public"."people"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chats" ADD CONSTRAINT "chats_from_store_id_stores_id_fk" FOREIGN KEY ("from_store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chats" ADD CONSTRAINT "chats_owner_person_id_people_id_fk" FOREIGN KEY ("owner_person_id") REFERENCES "public"."people"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chats" ADD CONSTRAINT "chats_owner_store_id_stores_id_fk" FOREIGN KEY ("owner_store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chat_messages_chat_id_created_at_index" ON "chat_messages" USING btree ("chat_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "chats_listing_id_from_person_id_index" ON "chats" USING btree ("listing_id","from_person_id");--> statement-breakpoint
CREATE INDEX "chats_from_person_id_last_message_at_index" ON "chats" USING btree ("from_person_id","last_message_at");--> statement-breakpoint
CREATE INDEX "chats_owner_person_id_last_message_at_index" ON "chats" USING btree ("owner_person_id","last_message_at");--> statement-breakpoint
CREATE INDEX "chats_from_store_id_index" ON "chats" USING btree ("from_store_id");--> statement-breakpoint
CREATE INDEX "chats_owner_store_id_index" ON "chats" USING btree ("owner_store_id");--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE no action ON UPDATE no action;