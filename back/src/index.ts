import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { initStatsRefreshCron } from './cron/stats-refresh.cron';

const PORT = Number(process.env.PORT) || 3000;

// Initialiser les crons
initStatsRefreshCron();

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 API Documentation: http://0.0.0.0:${PORT}/api`);
});

// Gestion d'erreur du serveur
server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = `Port ${PORT}`;

  switch (error.code) {
    case 'EACCES':
      console.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
});
