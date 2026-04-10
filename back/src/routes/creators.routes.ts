import { Router } from 'express';
import { getCreatorsStats, getAllCreators, getCreatorsTracking } from '../controllers/creators';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

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

/**
 * @route GET /api/creators/tracking
 * @description Liste des créateurs inscrits avec filtres TikTok connecté / a publié (suivi)
 */
router.get('/tracking', authMiddleware, getCreatorsTracking);

export default router;

