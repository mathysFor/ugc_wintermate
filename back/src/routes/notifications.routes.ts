import { Router } from 'express';
import { getNotifications, markRead, markAllRead } from '../controllers/notifications';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @route GET /api/notifications
 * @description Liste les notifications de l'utilisateur
 */
router.get('/', authMiddleware, getNotifications);

/**
 * @route POST /api/notifications/read-all
 * @description Marque toutes les notifications comme lues
 */
router.post('/read-all', authMiddleware, markAllRead);

/**
 * @route POST /api/notifications/:id/read
 * @description Marque une notification comme lue
 */
router.post('/:id/read', authMiddleware, markRead);

export default router;









