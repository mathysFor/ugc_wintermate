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

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route non trouvée', code: 'NOT_FOUND' });
});

export default app;
