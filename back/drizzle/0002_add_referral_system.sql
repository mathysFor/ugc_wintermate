-- Migration : Ajout du système de parrainage
-- Ajoute les colonnes de parrainage à la table users
-- Crée les tables referral_commissions et referral_invoices

-- Création de l'enum pour le statut des commissions
CREATE TYPE "referral_commission_status" AS ENUM ('pending', 'available', 'withdrawn');

-- Ajout des colonnes de parrainage à la table users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "referral_code" varchar(6) UNIQUE;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "referral_percentage" integer NOT NULL DEFAULT 10;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "referred_by_id" integer;

-- Génération des codes de parrainage pour les utilisateurs existants
-- Fonction pour générer un code aléatoire de 6 caractères
CREATE OR REPLACE FUNCTION generate_referral_code() RETURNS varchar(6) AS $$
DECLARE
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result varchar(6) := '';
  i integer;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Mise à jour des utilisateurs existants avec un code unique
DO $$
DECLARE
  user_record RECORD;
  new_code varchar(6);
  code_exists boolean;
BEGIN
  FOR user_record IN SELECT id FROM users WHERE referral_code IS NULL LOOP
    LOOP
      new_code := generate_referral_code();
      SELECT EXISTS(SELECT 1 FROM users WHERE referral_code = new_code) INTO code_exists;
      EXIT WHEN NOT code_exists;
    END LOOP;
    UPDATE users SET referral_code = new_code WHERE id = user_record.id;
  END LOOP;
END $$;

-- Suppression de la fonction temporaire
DROP FUNCTION IF EXISTS generate_referral_code();

-- Création de la table des commissions de parrainage
CREATE TABLE IF NOT EXISTS "referral_commissions" (
  "id" serial PRIMARY KEY,
  "referrer_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "referee_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "invoice_id" integer NOT NULL REFERENCES "invoices"("id") ON DELETE CASCADE,
  "amount_eur" integer NOT NULL,
  "status" "referral_commission_status" NOT NULL DEFAULT 'available',
  "created_at" timestamp NOT NULL DEFAULT now()
);

-- Création de la table des factures de parrainage
CREATE TABLE IF NOT EXISTS "referral_invoices" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "pdf_url" text NOT NULL,
  "amount_eur" integer NOT NULL,
  "status" "invoice_status" NOT NULL DEFAULT 'uploaded',
  "uploaded_at" timestamp NOT NULL DEFAULT now(),
  "paid_at" timestamp
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS "idx_users_referral_code" ON "users"("referral_code");
CREATE INDEX IF NOT EXISTS "idx_users_referred_by_id" ON "users"("referred_by_id");
CREATE INDEX IF NOT EXISTS "idx_referral_commissions_referrer_id" ON "referral_commissions"("referrer_id");
CREATE INDEX IF NOT EXISTS "idx_referral_commissions_referee_id" ON "referral_commissions"("referee_id");
CREATE INDEX IF NOT EXISTS "idx_referral_invoices_user_id" ON "referral_invoices"("user_id");





