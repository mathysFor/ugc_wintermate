-- Migration : Ajout des nouveaux types de notifications
-- Ajoute les valeurs à l'enum notification_type existant

ALTER TYPE "notification_type" ADD VALUE IF NOT EXISTS 'campaign_published';
ALTER TYPE "notification_type" ADD VALUE IF NOT EXISTS 'campaign_published_brand';
ALTER TYPE "notification_type" ADD VALUE IF NOT EXISTS 'new_creator_registered';
ALTER TYPE "notification_type" ADD VALUE IF NOT EXISTS 'new_creator_tiktok';
ALTER TYPE "notification_type" ADD VALUE IF NOT EXISTS 'new_submission';

