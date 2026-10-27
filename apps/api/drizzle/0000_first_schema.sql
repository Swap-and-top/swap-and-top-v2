CREATE TYPE "public"."action_kind" AS ENUM('none', 'warning', 'removal', 'suspension', 'ban');--> statement-breakpoint
CREATE TYPE "public"."appeal_outcome" AS ENUM('upheld', 'overturned');--> statement-breakpoint
CREATE TYPE "public"."cash_direction" AS ENUM('i-add', 'they-add', 'straight');--> statement-breakpoint
CREATE TYPE "public"."category" AS ENUM('phones', 'laptops', 'desktops', 'consoles', 'parts', 'accessories', 'other');--> statement-breakpoint
CREATE TYPE "public"."condition" AS ENUM('boxed-new', 'like-new', 'good', 'fair');--> statement-breakpoint
CREATE TYPE "public"."contact_shown_to" AS ENUM('everyone', 'offers');--> statement-breakpoint
CREATE TYPE "public"."deal_answer" AS ENUM('yes', 'no', 'not-yet');--> statement-breakpoint
CREATE TYPE "public"."deal_source" AS ENUM('offer', 'reveal');--> statement-breakpoint
CREATE TYPE "public"."deal_state" AS ENUM('pending', 'confirmed', 'closed', 'lapsed');--> statement-breakpoint
CREATE TYPE "public"."listing_status" AS ENUM('draft', 'live', 'paused', 'sold', 'expired', 'withdrawn', 'removed');--> statement-breakpoint
CREATE TYPE "public"."listing_type" AS ENUM('sale', 'swap', 'request', 'auction');--> statement-breakpoint
CREATE TYPE "public"."notification_kind" AS ENUM('offer', 'offer-reply', 'deal', 'lead', 'reveal', 'listing', 'saved', 'sponsor', 'account', 'report');--> statement-breakpoint
CREATE TYPE "public"."offer_cash_from" AS ENUM('owner', 'offerer', 'none');--> statement-breakpoint
CREATE TYPE "public"."offer_state" AS ENUM('pending', 'accepted', 'declined', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."pass_kind" AS ENUM('day', 'week', 'month');--> statement-breakpoint
CREATE TYPE "public"."payment_purpose" AS ENUM('store_pass', 'boost');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'paid', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."promotion_slot" AS ENUM('organic', 'sponsored', 'drop');--> statement-breakpoint
CREATE TYPE "public"."report_reason" AS ENUM('stolen', 'not-as-described', 'fake', 'duplicate', 'offensive', 'wrong-category', 'no-show', 'other');--> statement-breakpoint
CREATE TYPE "public"."report_state" AS ENUM('open', 'claimed', 'approved', 'cleared');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'moderator', 'admin', 'super_admin');--> statement-breakpoint
CREATE TYPE "public"."standing" AS ENUM('good', 'warned', 'limited', 'suspended', 'banned');--> statement-breakpoint
CREATE TYPE "public"."store_member_role" AS ENUM('owner', 'staff');--> statement-breakpoint
CREATE TABLE "appeals" (
	"id" text PRIMARY KEY NOT NULL,
	"action_id" text NOT NULL,
	"person_id" text NOT NULL,
	"statement" text NOT NULL,
	"reviewed_by_id" text,
	"outcome" "appeal_outcome",
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone,
	CONSTRAINT "appeals_actionId_unique" UNIQUE("action_id")
);
--> statement-breakpoint
ALTER TABLE "appeals" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "auction_details" (
	"listing_id" text PRIMARY KEY NOT NULL,
	"item_id" text NOT NULL,
	"starting_price" numeric(12, 2) NOT NULL,
	"reserve_price" numeric(12, 2),
	"currency" text DEFAULT 'USD' NOT NULL,
	"closes_at" timestamp with time zone NOT NULL,
	"extension_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "auction_details" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "boosts" (
	"id" text PRIMARY KEY NOT NULL,
	"listing_id" text NOT NULL,
	"bought_by_id" text NOT NULL,
	"daily_budget" numeric(12, 2) NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"stopped_at" timestamp with time zone,
	"payment_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "boosts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "deal_checks" (
	"id" text PRIMARY KEY NOT NULL,
	"source" "deal_source" NOT NULL,
	"offer_id" text,
	"reveal_id" text,
	"listing_id" text NOT NULL,
	"asker_id" text NOT NULL,
	"owner_id" text NOT NULL,
	"asker_answer" "deal_answer",
	"asker_answered_at" timestamp with time zone,
	"owner_answer" "deal_answer",
	"owner_answered_at" timestamp with time zone,
	"state" "deal_state" DEFAULT 'pending' NOT NULL,
	"prompted_at" timestamp with time zone,
	"deferred_at" timestamp with time zone,
	"resolved_at" timestamp with time zone,
	"lapses_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "deal_checks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "items" (
	"id" text PRIMARY KEY NOT NULL,
	"category" "category" NOT NULL,
	"name" text NOT NULL,
	"brand" text,
	"model" text,
	"condition" "condition",
	"defects" text,
	"accessories" text,
	"specs" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"images" text[] DEFAULT '{}' NOT NULL,
	"wanted" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "listings" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"type" "listing_type" NOT NULL,
	"owner_id" text NOT NULL,
	"store_id" text,
	"category" "category" NOT NULL,
	"title" text NOT NULL,
	"location" text NOT NULL,
	"status" "listing_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"sold_at" timestamp with time zone,
	"contact_channels" text[] DEFAULT '{}' NOT NULL,
	"contact_signed_in_only" boolean DEFAULT false NOT NULL,
	"contact_shown_to" "contact_shown_to" DEFAULT 'everyone' NOT NULL,
	"contact_to_stores" boolean DEFAULT false NOT NULL,
	"allow_store_offers" boolean DEFAULT true NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	CONSTRAINT "listings_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "listings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "moderation_actions" (
	"id" text PRIMARY KEY NOT NULL,
	"report_id" text,
	"person_id" text NOT NULL,
	"listing_id" text,
	"decided_by_id" text NOT NULL,
	"kind" "action_kind" NOT NULL,
	"reason" "report_reason" NOT NULL,
	"note" text,
	"until" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reversed_at" timestamp with time zone,
	"reversed_by_id" text
);
--> statement-breakpoint
ALTER TABLE "moderation_actions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"person_id" text,
	"store_id" text,
	"kind" "notification_kind" NOT NULL,
	"text" text NOT NULL,
	"href" text NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_has_audience" CHECK ("notifications"."person_id" is not null or "notifications"."store_id" is not null)
);
--> statement-breakpoint
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "offers" (
	"id" text PRIMARY KEY NOT NULL,
	"listing_id" text NOT NULL,
	"from_person_id" text NOT NULL,
	"from_store_id" text,
	"item_listing_id" text,
	"item_name" text,
	"item_condition" "condition",
	"cash_amount" numeric(12, 2) DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"cash_from" "offer_cash_from" NOT NULL,
	"message" text,
	"reach_on" text[] DEFAULT '{}' NOT NULL,
	"state" "offer_state" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"answered_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "offers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "payment_events" (
	"id" text PRIMARY KEY NOT NULL,
	"payment_id" text,
	"body" jsonb NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payment_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "payments" (
	"id" text PRIMARY KEY NOT NULL,
	"person_id" text NOT NULL,
	"store_id" text,
	"purpose" "payment_purpose" NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"provider" text DEFAULT 'paynow' NOT NULL,
	"provider_ref" text,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"paid_at" timestamp with time zone,
	CONSTRAINT "payments_providerRef_unique" UNIQUE("provider_ref")
);
--> statement-breakpoint
ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "people" (
	"id" text PRIMARY KEY NOT NULL,
	"auth_user_id" uuid,
	"phone" text,
	"email" text,
	"display_name" text NOT NULL,
	"role" "role" DEFAULT 'user' NOT NULL,
	"standing" "standing" DEFAULT 'good' NOT NULL,
	"suspended_until" timestamp with time zone,
	"location" text,
	"phone_verified_at" timestamp with time zone,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone,
	CONSTRAINT "people_authUserId_unique" UNIQUE("auth_user_id"),
	CONSTRAINT "people_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
ALTER TABLE "people" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "reports" (
	"id" text PRIMARY KEY NOT NULL,
	"number" integer GENERATED ALWAYS AS IDENTITY (sequence name "reports_number_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"reporter_id" text NOT NULL,
	"listing_id" text,
	"person_id" text NOT NULL,
	"reason" "report_reason" NOT NULL,
	"details" text,
	"state" "report_state" DEFAULT 'open' NOT NULL,
	"claimed_by_id" text,
	"claimed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"closed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "reports" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "request_details" (
	"listing_id" text PRIMARY KEY NOT NULL,
	"wants_item_id" text NOT NULL,
	"budget" numeric(12, 2) NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "request_details" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "reveals" (
	"id" text PRIMARY KEY NOT NULL,
	"listing_id" text NOT NULL,
	"viewer_id" text,
	"device_hash" text NOT NULL,
	"slot" "promotion_slot" DEFAULT 'organic' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reveals" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "sale_details" (
	"listing_id" text PRIMARY KEY NOT NULL,
	"item_id" text NOT NULL,
	"price" numeric(12, 2) NOT NULL,
	"previous_price" numeric(12, 2),
	"currency" text DEFAULT 'USD' NOT NULL,
	"negotiable" boolean DEFAULT true NOT NULL,
	"stock_count" integer,
	"accepts_swaps" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sale_details" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "saved_listings" (
	"person_id" text NOT NULL,
	"listing_id" text NOT NULL,
	"saved_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "saved_listings_person_id_listing_id_pk" PRIMARY KEY("person_id","listing_id")
);
--> statement-breakpoint
ALTER TABLE "saved_listings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "store_members" (
	"store_id" text NOT NULL,
	"person_id" text NOT NULL,
	"role" "store_member_role" NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	"removed_at" timestamp with time zone,
	CONSTRAINT "store_members_store_id_person_id_pk" PRIMARY KEY("store_id","person_id")
);
--> statement-breakpoint
ALTER TABLE "store_members" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "store_passes" (
	"id" text PRIMARY KEY NOT NULL,
	"store_id" text NOT NULL,
	"kind" "pass_kind" NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"payment_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "store_passes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "stores" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"initials" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"location" text NOT NULL,
	"opening_hours" text DEFAULT '' NOT NULL,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"closed_at" timestamp with time zone,
	CONSTRAINT "stores_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "stores" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "swap_details" (
	"listing_id" text PRIMARY KEY NOT NULL,
	"has_item_id" text NOT NULL,
	"wants_item_id" text NOT NULL,
	"cash_direction" "cash_direction" NOT NULL,
	"cash_amount" numeric(12, 2),
	"currency" text DEFAULT 'USD' NOT NULL,
	"cash_up_to" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "swap_details" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "appeals" ADD CONSTRAINT "appeals_action_id_moderation_actions_id_fk" FOREIGN KEY ("action_id") REFERENCES "public"."moderation_actions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appeals" ADD CONSTRAINT "appeals_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appeals" ADD CONSTRAINT "appeals_reviewed_by_id_people_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."people"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auction_details" ADD CONSTRAINT "auction_details_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auction_details" ADD CONSTRAINT "auction_details_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boosts" ADD CONSTRAINT "boosts_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boosts" ADD CONSTRAINT "boosts_bought_by_id_people_id_fk" FOREIGN KEY ("bought_by_id") REFERENCES "public"."people"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boosts" ADD CONSTRAINT "boosts_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal_checks" ADD CONSTRAINT "deal_checks_offer_id_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal_checks" ADD CONSTRAINT "deal_checks_reveal_id_reveals_id_fk" FOREIGN KEY ("reveal_id") REFERENCES "public"."reveals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal_checks" ADD CONSTRAINT "deal_checks_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal_checks" ADD CONSTRAINT "deal_checks_asker_id_people_id_fk" FOREIGN KEY ("asker_id") REFERENCES "public"."people"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal_checks" ADD CONSTRAINT "deal_checks_owner_id_people_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."people"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_owner_id_people_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."people"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_decided_by_id_people_id_fk" FOREIGN KEY ("decided_by_id") REFERENCES "public"."people"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_reversed_by_id_people_id_fk" FOREIGN KEY ("reversed_by_id") REFERENCES "public"."people"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_from_person_id_people_id_fk" FOREIGN KEY ("from_person_id") REFERENCES "public"."people"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_from_store_id_stores_id_fk" FOREIGN KEY ("from_store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_item_listing_id_listings_id_fk" FOREIGN KEY ("item_listing_id") REFERENCES "public"."listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_people_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."people"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_claimed_by_id_people_id_fk" FOREIGN KEY ("claimed_by_id") REFERENCES "public"."people"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_details" ADD CONSTRAINT "request_details_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_details" ADD CONSTRAINT "request_details_wants_item_id_items_id_fk" FOREIGN KEY ("wants_item_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reveals" ADD CONSTRAINT "reveals_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reveals" ADD CONSTRAINT "reveals_viewer_id_people_id_fk" FOREIGN KEY ("viewer_id") REFERENCES "public"."people"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_details" ADD CONSTRAINT "sale_details_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_details" ADD CONSTRAINT "sale_details_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_listings" ADD CONSTRAINT "saved_listings_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_listings" ADD CONSTRAINT "saved_listings_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_members" ADD CONSTRAINT "store_members_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_members" ADD CONSTRAINT "store_members_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_passes" ADD CONSTRAINT "store_passes_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_passes" ADD CONSTRAINT "store_passes_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "swap_details" ADD CONSTRAINT "swap_details_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "swap_details" ADD CONSTRAINT "swap_details_has_item_id_items_id_fk" FOREIGN KEY ("has_item_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "swap_details" ADD CONSTRAINT "swap_details_wants_item_id_items_id_fk" FOREIGN KEY ("wants_item_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "boosts_listing_id_ends_at_index" ON "boosts" USING btree ("listing_id","ends_at");--> statement-breakpoint
CREATE UNIQUE INDEX "deal_checks_listing_id_asker_id_owner_id_index" ON "deal_checks" USING btree ("listing_id","asker_id","owner_id");--> statement-breakpoint
CREATE INDEX "deal_checks_asker_id_index" ON "deal_checks" USING btree ("asker_id");--> statement-breakpoint
CREATE INDEX "deal_checks_owner_id_index" ON "deal_checks" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "listings_status_type_category_index" ON "listings" USING btree ("status","type","category");--> statement-breakpoint
CREATE INDEX "listings_owner_id_index" ON "listings" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "listings_store_id_index" ON "listings" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "moderation_actions_person_id_index" ON "moderation_actions" USING btree ("person_id");--> statement-breakpoint
CREATE INDEX "moderation_actions_report_id_index" ON "moderation_actions" USING btree ("report_id");--> statement-breakpoint
CREATE INDEX "notifications_person_id_created_at_index" ON "notifications" USING btree ("person_id","created_at");--> statement-breakpoint
CREATE INDEX "notifications_store_id_created_at_index" ON "notifications" USING btree ("store_id","created_at");--> statement-breakpoint
CREATE INDEX "offers_listing_id_index" ON "offers" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "offers_from_person_id_index" ON "offers" USING btree ("from_person_id");--> statement-breakpoint
CREATE INDEX "payments_person_id_index" ON "payments" USING btree ("person_id");--> statement-breakpoint
CREATE INDEX "reports_state_created_at_index" ON "reports" USING btree ("state","created_at");--> statement-breakpoint
CREATE INDEX "reports_person_id_index" ON "reports" USING btree ("person_id");--> statement-breakpoint
CREATE INDEX "reports_listing_id_index" ON "reports" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "reveals_listing_id_index" ON "reveals" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "reveals_device_hash_created_at_index" ON "reveals" USING btree ("device_hash","created_at");--> statement-breakpoint
CREATE INDEX "store_members_person_id_index" ON "store_members" USING btree ("person_id");--> statement-breakpoint
CREATE INDEX "store_passes_store_id_ends_at_index" ON "store_passes" USING btree ("store_id","ends_at");