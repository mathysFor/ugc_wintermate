# Cahier des Charges – Plateforme UGC TikTok  
**Nom de code temporaire :** TikBoost (à remplacer par ton vrai nom)  
**Version :** MVP – Test marché (aucun paiement intégré)  
**Date :** 09 décembre 2025  

## 1. Objectif du produit
Créer une plateforme qui met en relation :
- Des **marques** qui lancent des campagnes avec récompenses basées sur les vues TikTok
- Des **créateurs** qui soumettent leurs vidéos déjà publiées sur TikTok pour gagner de l’argent  

Tout le flux monétaire reste hors plateforme (virement, PayPal, etc.). La plateforme ne fait que tracker les performances et gérer les factures.

## 2. Rôles utilisateurs
| Rôle          | Description                                                                 |
|---------------|-----------------------------------------------------------------------------|
| Créateur      | Peut connecter plusieurs comptes TikTok, soumettre des vidéos, suivre ses gains |
| Marque        | Crée et gère des campagnes, valide les vidéos, marque les factures comme payées |
| Un même utilisateur peut être à la fois Créateur ET Marque                     |
| Admin         | Toi (accès complet pour modérer si besoin)                                  |

## 3. Stack technique retenue (MVP)
| Couche              | Technologie                                                                 |
|---------------------|-----------------------------------------------------------------------------|
| Frontend            | React 18 + TypeScript + Vite + TanStack Query + Zod                         |
| UI / Design         | Tailwind CSS + shadcn/ui + Headless UI → **style 100 % Notion-like**        |
| Backend             | Node.js + TypeScript + Fastify ou Express                                   |
| ORM                 | Drizzle ORM (schema-first)                                                  |
| Base de données     | PostgreSQL (Neon, Supabase ou Railway)                                      |
| Authentification    | Lucia Auth                                                                  |
| TikTok API          | **Service totalement indépendant** (retry, rate-limit, erreurs centralisées)|
| Jobs & Files        | BullMQ + Redis (refresh stats toutes les 4 h)                               |
| Stockage fichiers   | Supabase Storage ou Cloudinary                                              |
| Notifications       | Service séparé (in-app + prêt pour emails futurs)                           |
| Hébergement         | Frontend → Vercel Backend + Redis + Worker → Railway/Render                 |

## 4. Fonctionnalités détaillées du MVP

### 4.1 Inscription & Connexion
- Champs : email, prénom, nom, mot de passe
- Cases à cocher : « Je suis un créateur » et/ou « Je suis une marque »
- Pas de vérification email ni 2FA dans le MVP

### 4.2 Onboarding Créateur
- Connexion OAuth2 TikTok (comptes perso + pro autorisés)
- Scopes : `user.info.basic`, `video.list`, `video.views` + toutes les stats disponibles en lecture seule
- Possibilité de connecter **plusieurs comptes TikTok**
- Gestion de token expiré/révoqué → statut « connexion expirée » + blocage nouvelles soumissions

### 4.3 Onboarding Marque
- Nom de la marque, secteur (select), site web, logo (optionnel)

### 4.4 Création & gestion de campagne (Marque)
Champs obligatoires :
- Titre
- Description (éditeur riche – Tiptap ou Lexical)
- Image de couverture (upload)
- Vidéo explicative YouTube/Vimeo (embed)
- Documents additionnels (PDF) – optionnel
- Dates de début/fin (optionnelles)
- Paliers de récompense (ajout illimité) :
  - Nombre de vues cible
  - Montant en €
  - Cumulatif (oui/non) → plusieurs vidéos peuvent contribuer ou non
Statuts : **Brouillon → Active → En pause → Supprimée**

### 4.5 Soumission de vidéos (Créateur)
- Sur la page détail d’une campagne → bouton « Participer »
- Choix du compte TikTok (si plusieurs)
- Liste des vidéos récentes du compte (appel API TikTok)
- Sélection multiple possible
- Une même vidéo **ne peut pas** être soumise à plusieurs campagnes
- Possibilité de retirer une soumission (mais pas de remplacement)

### 4.6 Validation par la marque
- Liste des soumissions avec aperçu TikTok + stats actuelles
- Boutons **Accepter** / **Refuser** (motif optionnel)
- Notification instantanée au créateur

### 4.7 Refresh automatique des statistiques
- Worker BullMQ toutes les 4 heures
- Récupère toutes les métriques TikTok disponibles (vues, likes, commentaires, partages, durée moyenne, etc.)
- Mise à jour table optimisée `video_stats_current`
- Historique stocké dans table `video_stats_history` (colonne jsonb avec timestamp)

### 4.8 Paliers & Factures
- Dès qu’un palier est atteint → badge + bouton « Déposer ma facture (PDF) »
- Une facture par palier
- Upload PDF → statut « Facture déposée »
- Notification immédiate à la marque
- La marque peut marquer la facture comme « Payée » (action manuelle)

### 4.9 Centre de notifications in-app
- Cloche en haut à droite
- Liste complète avec filtres
- Service séparé pour ajouter les emails très facilement plus tard

## 5. Schéma de base de données (Drizzle – principales tables)

```ts
users
└── id, email, hashed_password, first_name, last_name, is_creator, is_brand, created_at

tiktok_accounts
└── id, user_id → users, tiktok_user_id, username, access_token, refresh_token, expires_at, is_valid

brands
└── id, user_id → users, name, sector, website, logo_url

campaigns
└── id, brand_id → brands, title, description, cover_image_url, youtube_url, status, start_date, end_date

campaign_rewards
└── id, campaign_id, views_target (bigint), amount_eur, allow_multiple_videos

campaign_submissions
└── id, campaign_id, tiktok_account_id, tiktok_video_id, status ('pending'|'accepted'|'refused'), submitted_at, validated_at, refuse_reason

video_stats_current
└── submission_id → campaign_submissions (1:1), views, likes, comments, shares, updated_at

video_stats_history
└── id, submission_id, stats_json (jsonb), captured_at

invoices
└── id, submission_id, reward_id → campaign_rewards, pdf_url, status ('uploaded'|'paid'), uploaded_at, paid_at
```

## 6. Arborescence des écrans

/                 → Landing publique
/login
/register
/dashboard
  /creator          → Mes campagnes, gains, factures
  /brand            → Mes campagnes, soumissions à valider
  /campaigns        → Toutes les campagnes actives
  /campaign/[id]    → Détail + participation
  /campaign/create
  /campaign/[id]/edit
  /notifications
  /profile
/admin              → Accès restreint (toi)

## 7. Design & UX

Style 100 % Notion : fond gris très clair (#f8f9fa), typo moderne (Inter ou Satoshi), beaucoup d’espace blanc, coins arrondis doux, ombres légères
Mobile-first obligatoire (80 % des créateurs sur mobile)
Dark mode prévu (activable facilement)


