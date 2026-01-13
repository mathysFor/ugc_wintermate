// #region agent log
fetch('http://127.0.0.1:7247/ingest/33cc8e5c-f359-45c2-9a3c-80250deab640',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.ts:1',message:'Starting server initialization',data:{nodeVersion:process.version,pid:process.pid},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
// #endregion

import dotenv from 'dotenv';
dotenv.config();

// #region agent log
fetch('http://127.0.0.1:7247/ingest/33cc8e5c-f359-45c2-9a3c-80250deab640',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.ts:5',message:'After dotenv config',data:{hasPort:!!process.env.PORT,port:process.env.PORT},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
// #endregion

import app from './app';
import { initStatsRefreshCron } from './cron/stats-refresh.cron';

const PORT = Number(process.env.PORT) || 3000;

// #region agent log
fetch('http://127.0.0.1:7247/ingest/33cc8e5c-f359-45c2-9a3c-80250deab640',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.ts:12',message:'Before app.listen',data:{port:PORT,appType:typeof app},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
// #endregion

// Gestion d'erreur globale non capturée
process.on('unhandledRejection', (reason, promise) => {
  // #region agent log
  fetch('http://127.0.0.1:7247/ingest/33cc8e5c-f359-45c2-9a3c-80250deab640',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.ts:unhandledRejection',message:'Unhandled rejection detected',data:{reason:String(reason)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  console.error('[UNHANDLED REJECTION]', {
    reason,
    promise,
    timestamp: new Date().toISOString(),
  });
  // Ne pas exit immédiatement, laisser Railway gérer
});

process.on('uncaughtException', (error) => {
  // #region agent log
  fetch('http://127.0.0.1:7247/ingest/33cc8e5c-f359-45c2-9a3c-80250deab640',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.ts:uncaughtException',message:'Uncaught exception detected',data:{message:error.message,stack:error.stack?.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
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

// #region agent log
fetch('http://127.0.0.1:7247/ingest/33cc8e5c-f359-45c2-9a3c-80250deab640',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.ts:35',message:'Calling app.listen',data:{port:PORT,host:'0.0.0.0'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
// #endregion

const server = app.listen(PORT, '0.0.0.0', () => {
  // #region agent log
  fetch('http://127.0.0.1:7247/ingest/33cc8e5c-f359-45c2-9a3c-80250deab640',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.ts:listen-callback',message:'Server listening successfully',data:{port:PORT,address:server.address()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 API Documentation: http://0.0.0.0:${PORT}/api`);
  console.log(`🏥 Healthcheck: http://0.0.0.0:${PORT}/health`);
});

// Gestion d'erreur du serveur
server.on('error', (error: NodeJS.ErrnoException) => {
  // #region agent log
  fetch('http://127.0.0.1:7247/ingest/33cc8e5c-f359-45c2-9a3c-80250deab640',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.ts:server-error',message:'Server error event',data:{code:error.code,syscall:error.syscall,message:error.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
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
