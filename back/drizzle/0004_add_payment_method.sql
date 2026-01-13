-- Migration: Add payment method option (invoice or gift card)
-- This allows creators to choose between receiving payment via invoice or gift card

-- Create the payment_method enum
CREATE TYPE "payment_method" AS ENUM ('invoice', 'gift_card');

-- Add payment_method column to invoices table and make pdf_url nullable
ALTER TABLE "invoices" ADD COLUMN "payment_method" "payment_method" DEFAULT 'invoice' NOT NULL;
ALTER TABLE "invoices" ALTER COLUMN "pdf_url" DROP NOT NULL;

-- Add payment_method column to referral_invoices table and make pdf_url nullable
ALTER TABLE "referral_invoices" ADD COLUMN "payment_method" "payment_method" DEFAULT 'invoice' NOT NULL;
ALTER TABLE "referral_invoices" ALTER COLUMN "pdf_url" DROP NOT NULL;





