import { Router } from 'express';
import { getGlobalViewTiers, upsertGlobalViewTiers } from '../controllers/global-view-tiers';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @route GET /api/global-view-tiers
 * @description Liste les paliers globaux de vues
 */
router.get('/', authMiddleware, getGlobalViewTiers);

/**
 * @route POST /api/global-view-tiers
 * @description Remplace la liste des paliers globaux de vues
 */
router.post('/', authMiddleware, upsertGlobalViewTiers);

export default router;
