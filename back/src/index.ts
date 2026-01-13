import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { initStatsRefreshCron } from './cron/stats-refresh.cron';

const PORT = Number(process.env.PORT) || 3000;

// Gestion d'erreur globale non capturée
process.on('unhandledRejection', (reason, promise) => {
  console.error('[UNHANDLED REJECTION]', {
    reason,
    promise,
    timestamp: new Date().toISOString(),
  });
  // Ne pas exit immédiatement, laisser Railway gérer
});

process.on('uncaughtException', (error) => {
  console.error('[UNCAUGHT EXCEPTION]', {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
  });
  // Logger mais ne pas exit pour permettre au healthcheck de répondre
});

// Initialiser les crons (peut échouer si DB non disponible, mais ne bloque pas le serveur)
try {
  initStatsRefreshCron();
} catch (error) {
  console.warn('[CRON] ⚠️  Impossible d\'initialiser les crons:', error);
}

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 API Documentation: http://0.0.0.0:${PORT}/api`);
  console.log(`🏥 Healthcheck: http://0.0.0.0:${PORT}/health`);
});

// Gestion d'erreur du serveur
server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.syscall !== 'listen') {
    console.error('[SERVER ERROR]', error);
    return;
  }

  const bind = `Port ${PORT}`;

  switch (error.code) {
    case 'EACCES':
      console.error(`[SERVER ERROR] ${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`[SERVER ERROR] ${bind} is already in use`);
      process.exit(1);
      break;
    default:
      console.error(`[SERVER ERROR] ${bind}`, error);
      // Ne pas throw, juste logger
  }
});
