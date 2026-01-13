import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error('[DB] ERREUR: DATABASE_URL n\'est pas défini dans les variables d\'environnement');
  throw new Error('DATABASE_URL is required');
}

console.log('[DB] Connexion à la base de données...', {
  hasUrl: !!process.env.DATABASE_URL,
  urlLength: process.env.DATABASE_URL?.length,
  urlPreview: process.env.DATABASE_URL?.substring(0, 30) + '...',
});

const pool = new Pool({
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
});

// Tester la connexion au démarrage
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
  });

export const db = drizzle(pool, { schema });
