import type { Request, Response } from 'express';
import type { AuthUser } from '@shared/types/auth';
import { notificationService } from '../../services/notifications.service';

/**
 * Marque une notification comme lue
 * @route POST /api/notifications/:id/read
 * @returns {NotificationResponse} Notification mise à jour
 */
export const markRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as Request & { user?: AuthUser }).user?.id;
    const notificationId = parseInt(req.params.id, 10);

    if (!userId) {
      res.status(401).json({ error: 'Non authentifié', code: 'UNAUTHORIZED' });
      return;
    }

    if (isNaN(notificationId)) {
      res.status(400).json({ error: 'ID invalide', code: 'INVALID_ID' });
      return;
    }

    const notification = await notificationService.markAsRead(notificationId, userId);

    if (!notification) {
      res.status(404).json({ error: 'Notification non trouvée', code: 'NOTIFICATION_NOT_FOUND' });
      return;
    }

    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message, code: 'INTERNAL_SERVER_ERROR' });
  }
};

/**
 * Marque toutes les notifications comme lues
 * @route POST /api/notifications/read-all
 * @returns {object} Nombre de notifications marquées comme lues
 */
export const markAllRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as Request & { user?: AuthUser }).user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Non authentifié', code: 'UNAUTHORIZED' });
      return;
    }

    const count = await notificationService.markAllAsRead(userId);

    res.json({ message: 'Toutes les notifications ont été marquées comme lues', count });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message, code: 'INTERNAL_SERVER_ERROR' });
  }
};









