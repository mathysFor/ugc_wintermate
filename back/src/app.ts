import express, { Request, Response } from 'express';
import cors from 'cors';

// Routes
import authRoutes from './routes/auth.routes';
import brandsRoutes from './routes/brands.routes';
import campaignsRoutes from './routes/campaigns.routes';
import rewardsRoutes from './routes/rewards.routes';
import submissionsRoutes from './routes/submissions.routes';
import tiktokRoutes from './routes/tiktok.routes';
import invoicesRoutes from './routes/invoices.routes';
import notificationsRoutes from './routes/notifications.routes';
import dashboardRoutes from './routes/dashboard.routes';
import referralRoutes from './routes/referral.routes';
import creatorsRoutes from './routes/creators.routes';
import academyRoutes from './routes/academy.routes';
import globalViewTiersRoutes from './routes/global-view-tiers.routes';

// #region agent log
fetch('http://127.0.0.1:7245/ingest/0c586d17-ebe2-41ba-8e31-f4aeee668c22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app.ts:15',message:'Importing creatorsRoutes',data:{hasCreatorsRoutes:!!creatorsRoutes},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
// #endregion

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'TikBoost API' });
});

app.get('/health', async (req: Request, res: Response) => {
  try {
    // Test simple de connexion DB (optionnel)
    // Si la DB n'est pas accessible, on retourne quand même un statut OK
    // car le serveur peut démarrer même sans DB (healthcheck minimal)
    res.status(200).json({ 
      status: 'ok', 
      health: 'healthy',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'error', 
      health: 'unhealthy',
      error: 'Service unavailable'
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/brands', brandsRoutes);
app.use('/api/campaigns', campaignsRoutes);
app.use('/api/rewards', rewardsRoutes);
app.use('/api/submissions', submissionsRoutes);
app.use('/api/tiktok', tiktokRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/referral', referralRoutes);
app.use('/api/creators', creatorsRoutes);
app.use('/api/academy', academyRoutes);
app.use('/api/global-view-tiers', globalViewTiersRoutes);

// #region agent log
fetch('http://127.0.0.1:7245/ingest/0c586d17-ebe2-41ba-8e31-f4aeee668c22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app.ts:58',message:'Registered /api/creators route',data:{creatorsRoutesType:typeof creatorsRoutes},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
// #endregion

// 404 handler
app.use((req: Request, res: Response) => {
  // #region agent log
  fetch('http://127.0.0.1:7245/ingest/0c586d17-ebe2-41ba-8e31-f4aeee668c22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app.ts:61',message:'404 handler triggered',data:{method:req.method,path:req.path,url:req.url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  res.status(404).json({ error: 'Route non trouvée', code: 'NOT_FOUND' });
});

export default app;
