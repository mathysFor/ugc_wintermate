# Guide de déploiement sur Railway

## 📋 Prérequis

1. Compte Railway créé sur [railway.app](https://railway.app)
2. CLI Railway installée : `npm i -g @railway/cli`
3. Base de données PostgreSQL (fournie par Railway)

## 🚀 Étapes de déploiement

### 1. Se connecter à Railway

```bash
railway login
```

### 2. Créer un nouveau projet

```bash
railway init
```

Ou via l'interface web : "New Project" → "Deploy from GitHub repo"

### 3. Ajouter une base de données PostgreSQL

Dans le dashboard Railway :
- Cliquez sur "New" → "Database" → "Add PostgreSQL"
- Notez les variables d'environnement générées (DATABASE_URL, PGHOST, PGPORT, etc.)

### 4. Configurer les variables d'environnement

Dans le dashboard Railway, allez dans "Variables" et ajoutez :

#### Variables obligatoires

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/dbname

# JWT
JWT_SECRET=ton_secret_jwt_super_securise

# TikTok OAuth
TIKTOK_CLIENT_KEY=ton_client_key
TIKTOK_CLIENT_SECRET=ton_client_secret
TIKTOK_REDIRECT_URI=https://ton-backend.railway.app/api/tiktok/callback

# Cloudflare R2 (pour les fichiers)
CLOUDFLARE_R2_ENDPOINT=https://ton-account.r2.cloudflarestorage.com
CLOUDFLARE_R2_ACCESS_KEY_ID=ton_access_key
CLOUDFLARE_R2_SECRET_ACCESS_KEY=ton_secret_key
CLOUDFLARE_R2_BUCKET_NAME=ton_bucket
CLOUDFLARE_R2_PUBLIC_URL=https://ton-cdn.domain.com

# Customer.io (optionnel)
CUSTOMERIO_SITE_ID=ton_site_id
CUSTOMERIO_API_KEY=ton_api_key

# Slack (optionnel)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/ton/webhook/url
```

### 5. Configurer le service

Dans Railway, sélectionne ton service backend et configure :

#### Build Settings

**Option 1 : Depuis la racine (RECOMMANDÉ - pour accéder au dossier shared/)**

1. **Root Directory** : Ne pas définir de Root Directory (laisser vide)
2. **Build Command** : `cd back && npm install --include=dev && npm run build`
3. **Start Command** : `cd back && node dist/index.js`

**Option 2 : Root Directory = `/back` (nécessite que shared/ soit copié)**

1. **Root Directory** : Clique sur "Add Root Directory" et entre `back`
2. **Build Command** : `npm install --include=dev && (if [ -d ../shared ]; then cp -r ../shared ./shared; fi) && npm run build`
3. **Start Command** : `node dist/index.js`

⚠️ **Important** : Ne pas utiliser `rollup` - le build utilise maintenant `tsc` directement.

#### Health Check
- **Path** : `/health` (si tu as créé cette route)
- **Timeout** : 100ms

### 6. Configurer la base de données

Une fois la DB créée, exécute les migrations :

```bash
# Option 1: Via Railway CLI
railway run --service backend "cd back && npm run db:push"

# Option 2: Via l'interface Railway
# Va dans "Database" → "Query" et exécute les migrations SQL depuis /back/drizzle/
```

### 7. Déployer

```bash
# Option 1: Via CLI
railway up

# Option 2: Via Git
git push origin main
# Railway déploiera automatiquement si connecté à GitHub
```

### 8. Vérifier le déploiement

1. Va dans "Settings" → "Networking" → "Generate Domain"
2. Teste ton API : `https://ton-backend.railway.app/api/health`

## 🔧 Configuration avancée

### Utiliser le fichier railway.json

Le projet contient déjà un `railway.json` à la racine qui configure :
- Builder NIXPACKS (détecte automatiquement Node.js)
- Commandes de build et start
- Health check

### Variables d'environnement par environnement

Railway supporte les variables d'environnement par service. Tu peux avoir :
- `production` : Variables de prod
- `staging` : Variables de test

### Base de données

Railway provisionne automatiquement une DB PostgreSQL. La `DATABASE_URL` est disponible automatiquement.

**Important** : N'oublie pas d'exécuter les migrations Drizzle :
```bash
cd back
npx drizzle-kit push
```

### Logs

Accède aux logs en temps réel :
```bash
railway logs
```

Ou via le dashboard Railway dans "Deployments" → "View Logs"

## 🐛 Troubleshooting

### Build échoue

1. Vérifie que `npm run build` fonctionne en local
2. Vérifie les logs : `railway logs`
3. Vérifie que toutes les variables d'environnement sont définies

### Service ne démarre pas

1. Vérifie la commande `startCommand` dans railway.json
2. Vérifie que `dist/index.js` existe après le build
3. Vérifie les logs d'erreur : `railway logs`

### Base de données non accessible

1. Vérifie que la DB est créée dans Railway
2. Vérifie la variable `DATABASE_URL`
3. Vérifie que les migrations sont exécutées

### Variables d'environnement manquantes

1. Vérifie dans "Variables" du dashboard Railway
2. Vérifie que les variables sont dans le bon service
3. Redéploie après avoir ajouté les variables

## 📝 Notes importantes

- **Port** : Railway expose automatiquement le port via `PORT` (défaut : 3000)
- **HTTPS** : Railway fournit HTTPS automatiquement
- **Domaines** : Tu peux générer un domaine gratuit ou utiliser ton propre domaine
- **Scaling** : Railway scale automatiquement selon la charge

## 🔄 Mise à jour

Pour mettre à jour le service :

```bash
git add .
git commit -m "Update"
git push
```

Railway déploiera automatiquement si connecté à GitHub.

Pour déployer manuellement :
```bash
railway up
```

