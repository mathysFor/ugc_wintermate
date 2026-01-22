-- Migration : Ajout du flag new_20 pour le support multi-environnements TikTok
-- Ajoute la colonne new_20 à la table users pour identifier les nouveaux utilisateurs
-- qui doivent utiliser TIKTOK_APP_1_* credentials

-- Ajout de la colonne new_20 avec valeur par défaut false pour rétrocompatibilité
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "new_20" boolean NOT NULL DEFAULT false;

-- Index pour améliorer les performances des requêtes filtrant par new_20
CREATE INDEX IF NOT EXISTS "idx_users_new_20" ON "users"("new_20");

