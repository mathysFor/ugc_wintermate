import type { Request, Response } from 'express';
import { eq, gt, lt, asc, desc, and, isNull } from 'drizzle-orm';
import { db } from '../../db/index';
import { notifications } from '../../db/schema';
import type { PaginatedNotificationsResponse } from '@shared/types/notifications';
import type { AuthUser } from '@shared/types/auth';

/**
 * Récupère les notifications de l'utilisateur avec pagination
 * @route GET /api/notifications
 * @param {string} cursor - Cursor pour la pagination
 * @param {number} limit - Nombre d'éléments par page
 * @param {string} unreadOnly - Si 'true', retourne uniquement les non lues
 * @returns {PaginatedNotificationsResponse} Liste paginée des notifications
 */
export const getNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as Request & { user?: AuthUser }).user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Non authentifié', code: 'UNAUTHORIZED' });
      return;
    }

    const { cursor, limit = '20', direction = 'next', unreadOnly = 'false' } = req.query;
    const limitNum = Math.min(Math.max(parseInt(limit as string, 10) || 20, 1), 100);

    // Construire les conditions
    const conditions = [eq(notifications.userId, userId)];

    if (unreadOnly === 'true') {
      conditions.push(isNull(notifications.readAt));
    }

    if (cursor) {
      const cursorNum = parseInt(cursor as string, 10);
      if (!isNaN(cursorNum)) {
        if (direction === 'next') {
          conditions.push(lt(notifications.id, cursorNum)); // Plus récentes d'abord
        } else {
          conditions.push(gt(notifications.id, cursorNum));
        }
      }
    }

    const results = await db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.id)) // Plus récentes d'abord
      .limit(limitNum + 1);

    const hasMore = results.length > limitNum;
    const items = hasMore ? results.slice(0, -1) : results;

    // Compter les non lues
    const unreadNotifications = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));

    const response: PaginatedNotificationsResponse = {
      items: items.map((n) => ({
        id: n.id,
        userId: n.userId,
        type: n.type,
        title: n.title,
        message: n.message,
        data: n.data as Record<string, unknown> | null,
        readAt: n.readAt?.toISOString() ?? null,
        createdAt: n.createdAt.toISOString(),
      })),
      nextCursor: hasMore && items.length > 0 ? items[items.length - 1].id : null,
      hasMore,
      unreadCount: unreadNotifications.length,
    };

    res.json(response);
  } catch (error) {
    console.error('[GetNotifications] Erreur:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId: (req as Request & { user?: AuthUser }).user?.id,
      query: req.query,
    });
    res.status(500).json({ error: (error as Error).message, code: 'INTERNAL_SERVER_ERROR' });
  }
};









