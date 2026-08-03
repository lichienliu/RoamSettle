CREATE TYPE "public"."batch_status" AS ENUM('open', 'completed');--> statement-breakpoint
CREATE TYPE "public"."item_status" AS ENUM('pending', 'paid', 'settled_offline');--> statement-breakpoint
CREATE TYPE "public"."member_role" AS ENUM('organizer', 'member');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'confirmed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."trip_status" AS ENUM('active', 'completed');--> statement-breakpoint
CREATE TABLE "expense_shares" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expense_id" uuid NOT NULL,
	"member_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"payer_member_id" uuid NOT NULL,
	"title" text NOT NULL,
	"amount_units" bigint NOT NULL,
	"created_by_member_id" uuid NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone,
	"settlement_batch_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "expenses_amount_positive" CHECK ("expenses"."amount_units" > 0)
);
--> statement-breakpoint
CREATE TABLE "settlement_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"locked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"fx_rate_numerator" bigint NOT NULL,
	"fx_rate_denominator" bigint NOT NULL,
	"status" "batch_status" DEFAULT 'open' NOT NULL,
	CONSTRAINT "fx_numerator_positive" CHECK ("settlement_batches"."fx_rate_numerator" > 0),
	CONSTRAINT "fx_denominator_positive" CHECK ("settlement_batches"."fx_rate_denominator" > 0)
);
--> statement-breakpoint
CREATE TABLE "settlement_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" uuid NOT NULL,
	"debtor_member_id" uuid NOT NULL,
	"creditor_member_id" uuid NOT NULL,
	"amount_usdc_units" bigint NOT NULL,
	"status" "item_status" DEFAULT 'pending' NOT NULL,
	CONSTRAINT "settlement_amount_positive" CHECK ("settlement_items"."amount_usdc_units" > 0),
	CONSTRAINT "debtor_not_creditor" CHECK ("settlement_items"."debtor_member_id" <> "settlement_items"."creditor_member_id")
);
--> statement-breakpoint
CREATE TABLE "settlement_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"settlement_item_id" uuid NOT NULL,
	"payer_address" text NOT NULL,
	"recipient_address" text NOT NULL,
	"expected_amount_units" bigint NOT NULL,
	"actual_amount_units" bigint,
	"transaction_id" text,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"settled_offline" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"confirmed_at" timestamp with time zone,
	CONSTRAINT "settlement_payments_transaction_id_unique" UNIQUE("transaction_id"),
	CONSTRAINT "onchain_or_offline" CHECK ("settlement_payments"."transaction_id" is not null or "settlement_payments"."settled_offline" = true)
);
--> statement-breakpoint
CREATE TABLE "trip_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"user_id" uuid,
	"nickname" text NOT NULL,
	"wallet_address" text,
	"role" "member_role" DEFAULT 'member' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"start_date" date,
	"end_date" date,
	"base_currency" text NOT NULL,
	"creator_user_id" uuid NOT NULL,
	"invite_token" text NOT NULL,
	"status" "trip_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "trips_invite_token_unique" UNIQUE("invite_token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wallet_address" text,
	"display_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_wallet_address_unique" UNIQUE("wallet_address")
);
--> statement-breakpoint
ALTER TABLE "expense_shares" ADD CONSTRAINT "expense_shares_expense_id_expenses_id_fk" FOREIGN KEY ("expense_id") REFERENCES "public"."expenses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_shares" ADD CONSTRAINT "expense_shares_member_id_trip_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."trip_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_payer_member_id_trip_members_id_fk" FOREIGN KEY ("payer_member_id") REFERENCES "public"."trip_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_created_by_member_id_trip_members_id_fk" FOREIGN KEY ("created_by_member_id") REFERENCES "public"."trip_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_settlement_batch_id_settlement_batches_id_fk" FOREIGN KEY ("settlement_batch_id") REFERENCES "public"."settlement_batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settlement_batches" ADD CONSTRAINT "settlement_batches_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settlement_items" ADD CONSTRAINT "settlement_items_batch_id_settlement_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."settlement_batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settlement_items" ADD CONSTRAINT "settlement_items_debtor_member_id_trip_members_id_fk" FOREIGN KEY ("debtor_member_id") REFERENCES "public"."trip_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settlement_items" ADD CONSTRAINT "settlement_items_creditor_member_id_trip_members_id_fk" FOREIGN KEY ("creditor_member_id") REFERENCES "public"."trip_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settlement_payments" ADD CONSTRAINT "settlement_payments_settlement_item_id_settlement_items_id_fk" FOREIGN KEY ("settlement_item_id") REFERENCES "public"."settlement_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_members" ADD CONSTRAINT "trip_members_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_members" ADD CONSTRAINT "trip_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_creator_user_id_users_id_fk" FOREIGN KEY ("creator_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "expense_shares_expense_member_uq" ON "expense_shares" USING btree ("expense_id","member_id");--> statement-breakpoint
CREATE INDEX "expenses_trip_idx" ON "expenses" USING btree ("trip_id");--> statement-breakpoint
CREATE INDEX "expenses_batch_idx" ON "expenses" USING btree ("settlement_batch_id");--> statement-breakpoint
CREATE INDEX "settlement_batches_trip_idx" ON "settlement_batches" USING btree ("trip_id");--> statement-breakpoint
CREATE INDEX "settlement_items_batch_idx" ON "settlement_items" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "settlement_payments_item_idx" ON "settlement_payments" USING btree ("settlement_item_id");--> statement-breakpoint
CREATE INDEX "trip_members_trip_idx" ON "trip_members" USING btree ("trip_id");--> statement-breakpoint
CREATE UNIQUE INDEX "trip_members_trip_user_uq" ON "trip_members" USING btree ("trip_id","user_id") WHERE "trip_members"."user_id" is not null;