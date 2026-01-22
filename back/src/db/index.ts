import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config();

// Ne pas throw si DATABASE_URL manque, mais logger un warning
// Le serveur peut démarrer et le healthcheck peut répondre
if (!process.env.DATABASE_URL) {
  console.warn('[DB] ⚠️  WARNING: DATABASE_URL n\'est pas défini dans les variables d\'environnement');
  console.warn('[DB] ⚠️  Le serveur démarrera mais les fonctionnalités DB ne seront pas disponibles');
  console.warn('[DB] ⚠️  Création d\'un pool de connexion vide (les requêtes échoueront)');
}

let pool: Pool;
let db: ReturnType<typeof drizzle>;

if (process.env.DATABASE_URL) {
  try {
    const dbUrl = new URL(process.env.DATABASE_URL);
    const dbName = dbUrl.pathname.replace('/', '');
    const dbHost = dbUrl.hostname;
    
    console.log('[DB] Connexion à la base de données...', {
      database: dbName,
      host: dbHost,
      hasUrl: !!process.env.DATABASE_URL,
      urlLength: process.env.DATABASE_URL?.length,
      urlPreview: process.env.DATABASE_URL?.substring(0, 50) + '...',
    });
  } catch (e) {
    console.log('[DB] Connexion à la base de données...', {
      hasUrl: !!process.env.DATABASE_URL,
      urlLength: process.env.DATABASE_URL?.length,
      urlPreview: process.env.DATABASE_URL?.substring(0, 50) + '...',
      parseError: e instanceof Error ? e.message : String(e),
    });
  }

  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  // Tester la connexion
  pool.on('connect', () => {
    console.log('[DB] ✅ Connexion à la base de données établie');
  });

  pool.on('error', (err: Error) => {
    console.error('[DB] ❌ Erreur de connexion à la base de données:', {
      message: err.message,
      stack: err.stack,
      code: (err as NodeJS.ErrnoException).code,
    });
    // Ne pas throw, juste logger l'erreur
  });

  // Tester la connexion au démarrage (non bloquant)
  pool.query('SELECT NOW()')
    .then(() => {
      console.log('[DB] ✅ Test de connexion réussi');
    })
    .catch((err: Error) => {
      console.error('[DB] ❌ Test de connexion échoué:', {
        message: err.message,
        stack: err.stack,
        code: (err as NodeJS.ErrnoException).code,
      });
      // Ne pas throw, le serveur peut démarrer même si la DB n'est pas accessible
    });

  db = drizzle(pool, { schema });
} else {
  // Créer un pool avec une URL invalide pour éviter les erreurs d'import
  // Les routes qui utilisent db échoueront avec une erreur claire
  pool = new Pool({
    connectionString: 'postgresql://invalid:invalid@invalid:5432/invalid',
  });
  db = drizzle(pool, { schema });
  console.warn('[DB] ⚠️  Base de données non initialisée - DATABASE_URL manquant');
  console.warn('[DB] ⚠️  Les requêtes DB échoueront jusqu\'à ce que DATABASE_URL soit configuré');
}

export { db };
