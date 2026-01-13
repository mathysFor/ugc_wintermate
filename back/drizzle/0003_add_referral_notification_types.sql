-- Migration : Ajout des types de notifications pour le parrainage
-- Ajoute les valeurs à l'enum notification_type existant

ALTER TYPE "notification_type" ADD VALUE IF NOT EXISTS 'referral_new_referee';
ALTER TYPE "notification_type" ADD VALUE IF NOT EXISTS 'referral_commission_earned';
ALTER TYPE "notification_type" ADD VALUE IF NOT EXISTS 'referral_invoice_uploaded';
ALTER TYPE "notification_type" ADD VALUE IF NOT EXISTS 'referral_invoice_paid';





