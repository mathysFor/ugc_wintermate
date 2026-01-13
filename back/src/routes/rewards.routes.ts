import { Router } from 'express';
import { updateReward, deleteReward } from '../controllers/campaign-rewards';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @route POST /api/rewards/:id/update
 * @description Met à jour un palier de récompense
 */
router.post('/:id/update', authMiddleware, updateReward);

/**
 * @route POST /api/rewards/:id/delete
 * @description Supprime un palier de récompense
 */
router.post('/:id/delete', authMiddleware, deleteReward);

export default router;


