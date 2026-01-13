CREATE TYPE "public"."campaign_status" AS ENUM('draft', 'active', 'paused', 'deleted');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('uploaded', 'paid');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('submission_accepted', 'submission_refused', 'invoice_uploaded', 'invoice_paid', 'milestone_reached', 'campaign_update', 'campaign_published', 'campaign_published_brand', 'new_creator_registered', 'new_creator_tiktok', 'new_submission', 'referral_new_referee', 'referral_commission_earned', 'referral_invoice_uploaded', 'referral_invoice_paid');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('invoice', 'gift_card');--> statement-breakpoint
CREATE TYPE "public"."referral_commission_status" AS ENUM('pending', 'available', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."submission_status" AS ENUM('pending', 'accepted', 'refused');--> statement-breakpoint
CREATE TABLE "brands" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" varchar(256) NOT NULL,
	"sector" varchar(256) NOT NULL,
	"website" text,
	"logo_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "brands_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "campaign_rewards" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" integer NOT NULL,
	"views_target" bigint NOT NULL,
	"amount_eur" integer NOT NULL,
	"allow_multiple_videos" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" integer NOT NULL,
	"tiktok_account_id" integer NOT NULL,
	"tiktok_video_id" varchar(256) NOT NULL,
	"cover_image_url" text,
	"status" "submission_status" DEFAULT 'pending' NOT NULL,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"validated_at" timestamp,
	"refuse_reason" text,
	"ads_code" text
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"brand_id" integer NOT NULL,
	"title" varchar(512) NOT NULL,
	"description" text NOT NULL,
	"cover_image_url" text,
	"youtube_url" text,
	"status" "campaign_status" DEFAULT 'draft' NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"submission_id" integer NOT NULL,
	"reward_id" integer NOT NULL,
	"pdf_url" text,
	"payment_method" "payment_method" DEFAULT 'invoice' NOT NULL,
	"status" "invoice_status" DEFAULT 'uploaded' NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"paid_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" varchar(256) NOT NULL,
	"message" text NOT NULL,
	"data" jsonb,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referral_commissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"referrer_id" integer NOT NULL,
	"referee_id" integer NOT NULL,
	"invoice_id" integer NOT NULL,
	"amount_eur" integer NOT NULL,
	"status" "referral_commission_status" DEFAULT 'available' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referral_invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"pdf_url" text,
	"payment_method" "payment_method" DEFAULT 'invoice' NOT NULL,
	"amount_eur" integer NOT NULL,
	"status" "invoice_status" DEFAULT 'uploaded' NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"paid_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "tiktok_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"tiktok_user_id" varchar(256) NOT NULL,
	"username" varchar(256) NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"is_valid" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "video_stats_current" (
	"submission_id" integer PRIMARY KEY NOT NULL,
	"views" bigint DEFAULT 0 NOT NULL,
	"likes" bigint DEFAULT 0 NOT NULL,
	"comments" bigint DEFAULT 0 NOT NULL,
	"shares" bigint DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "video_stats_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"submission_id" integer NOT NULL,
	"stats_json" jsonb NOT NULL,
	"captured_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "email" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "hashed_password" text NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "first_name" varchar(256) NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_name" varchar(256) NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone" varchar(32);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_creator" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_brand" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "referral_code" varchar(6);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "referral_percentage" integer DEFAULT 10 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "referred_by_id" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "brands" ADD CONSTRAINT "brands_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_rewards" ADD CONSTRAINT "campaign_rewards_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_submissions" ADD CONSTRAINT "campaign_submissions_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_submissions" ADD CONSTRAINT "campaign_submissions_tiktok_account_id_tiktok_accounts_id_fk" FOREIGN KEY ("tiktok_account_id") REFERENCES "public"."tiktok_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_submission_id_campaign_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."campaign_submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_reward_id_campaign_rewards_id_fk" FOREIGN KEY ("reward_id") REFERENCES "public"."campaign_rewards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_commissions" ADD CONSTRAINT "referral_commissions_referrer_id_users_id_fk" FOREIGN KEY ("referrer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_commissions" ADD CONSTRAINT "referral_commissions_referee_id_users_id_fk" FOREIGN KEY ("referee_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_commissions" ADD CONSTRAINT "referral_commissions_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_invoices" ADD CONSTRAINT "referral_invoices_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tiktok_accounts" ADD CONSTRAINT "tiktok_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_stats_current" ADD CONSTRAINT "video_stats_current_submission_id_campaign_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."campaign_submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_stats_history" ADD CONSTRAINT "video_stats_history_submission_id_campaign_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."campaign_submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "name";--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_email_unique" UNIQUE("email");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_referral_code_unique" UNIQUE("referral_code");