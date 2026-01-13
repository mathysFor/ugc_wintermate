import { Router } from 'express';
import { getBrandDashboardStats, getCreatorDashboardStats } from '../controllers/dashboard';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @route GET /api/dashboard/brand/stats
 * @description Récupère les statistiques du dashboard pour une marque
 */
router.get('/brand/stats', authMiddleware, getBrandDashboardStats);

/**
 * @route GET /api/dashboard/creator/stats
 * @description Récupère les statistiques du dashboard pour un créateur
 */
router.get('/creator/stats', authMiddleware, getCreatorDashboardStats);

export default router;

