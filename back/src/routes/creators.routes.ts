import { Router } from 'express';
import { getCreatorsStats } from '../controllers/creators/get-creators-stats.controller';
import { getAllCreators } from '../controllers/creators/get-all-creators.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// #region agent log
fetch('http://127.0.0.1:7245/ingest/0c586d17-ebe2-41ba-8e31-f4aeee668c22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'creators.routes.ts:6',message:'Router created',data:{hasGetCreatorsStats:!!getCreatorsStats,hasGetAllCreators:!!getAllCreators},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
// #endregion

/**
 * @route GET /api/creators/stats
 * @description Récupère les statistiques globales des créateurs (vues totales, total payé, nombre créateurs, moyenne)
 */
router.get('/stats', authMiddleware, getCreatorsStats);

/**
 * @route GET /api/creators
 * @description Récupère la liste paginée des créateurs avec leurs statistiques
 */
router.get('/', authMiddleware, getAllCreators);

// #region agent log
fetch('http://127.0.0.1:7245/ingest/0c586d17-ebe2-41ba-8e31-f4aeee668c22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'creators.routes.ts:18',message:'Routes registered on router',data:{routerStackLength:router.stack?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
// #endregion

export default router;

