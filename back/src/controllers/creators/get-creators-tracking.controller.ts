import { Request, Response } from 'express';
import { eq, inArray, asc } from 'drizzle-orm';
import { db } from '../../db';
import { users, tiktokAccounts, campaignSubmissions } from '../../db/schema';
import type { CreatorsTrackingResponse, CreatorTrackingItem } from '@shared/types/creators';
import type { AuthUser } from '@shared/types/auth';

/**
 * Récupère la liste des créateurs inscrits avec statut TikTok et publication (suivi)
 * @route GET /api/creators/tracking
 * @param {string} cursor - Cursor pour la pagination (id utilisateur)
 * @param {number} limit - Nombre d'éléments par page (max 100)
 * @param {string} direction - Direction de pagination ('next' | 'prev')
 * @param {string} tiktokConnected - Filtre TikTok : 'true' (connecté), 'false' (non connecté), absent = tous
 * @param {string} hasPublished - Filtre publication : 'true' (a publié), 'false' (pas encore publié), absent = tous
 * @returns {CreatorsTrackingResponse} Liste paginée des créateurs avec tiktokConnected et hasPublished
 */
export const getCreatorsTracking = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as Request & { user?: AuthUser }).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Non authentifié', code: 'UNAUTHORIZED' });
      return;
    }

    const [brandUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!brandUser?.isBrand) {
      res.status(403).json({ error: 'Accès réservé aux marques', code: 'NOT_A_BRAND' });
      return;
    }

    const { cursor, limit = '20', direction = 'next', tiktokConnected, hasPublished } = req.query;
    const limitNum = Math.min(Math.max(parseInt(limit as string, 10) || 20, 1), 100);

    const allCreators = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.isCreator, true))
      .orderBy(asc(users.id));

    if (allCreators.length === 0) {
      res.json({ items: [], nextCursor: null, hasMore: false });
      return;
    }

    const creatorIds = allCreators.map((c) => c.id);

    const allTiktokAccounts = await db
      .select({
        id: tiktokAccounts.id,
        userId: tiktokAccounts.userId,
        username: tiktokAccounts.username,
      })
      .from(tiktokAccounts)
      .where(inArray(tiktokAccounts.userId, creatorIds));

    const tiktokAccountIdsWithSubmissions = await db
      .selectDistinct({ tiktokAccountId: campaignSubmissions.tiktokAccountId })
      .from(campaignSubmissions);

    const publishedTiktokAccountIds = new Set(
      tiktokAccountIdsWithSubmissions.map((r) => r.tiktokAccountId)
    );

    const tiktokByUserId = new Map<number, Array<{ id: number; username: string }>>();
    for (const acc of allTiktokAccounts) {
      if (!tiktokByUserId.has(acc.userId)) {
        tiktokByUserId.set(acc.userId, []);
      }
      tiktokByUserId.get(acc.userId)!.push({ id: acc.id, username: acc.username });
    }

    const items: CreatorTrackingItem[] = allCreators
      .map((creator) => {
        const accounts = tiktokByUserId.get(creator.id) ?? [];
        const tiktokConnected = accounts.length > 0;
        const hasPublished = accounts.some((a) => publishedTiktokAccountIds.has(a.id));
        const username = accounts.length > 0 ? accounts[0].username : null;

        return {
          id: creator.id,
          firstName: creator.firstName,
          lastName: creator.lastName,
          email: creator.email,
          createdAt: creator.createdAt.toISOString(),
          tiktokConnected,
          hasPublished,
          username,
        };
      })
      .filter((item) => {
        if (tiktokConnected === 'true' && !item.tiktokConnected) return false;
        if (tiktokConnected === 'false' && item.tiktokConnected) return false;
        if (hasPublished === 'true' && !item.hasPublished) return false;
        if (hasPublished === 'false' && item.hasPublished) return false;
        return true;
      });

    items.sort((a, b) => a.id - b.id);

    let filtered = items;
    if (cursor) {
      const cursorNum = parseInt(cursor as string, 10);
      if (!isNaN(cursorNum)) {
        const idx = items.findIndex((c) => c.id === cursorNum);
        if (idx !== -1) {
          filtered =
            direction === 'next'
              ? items.slice(idx + 1)
              : items.slice(0, idx).reverse();
        }
      }
    } else if (direction === 'prev') {
      filtered = [...items].reverse();
    }

    const hasMore = filtered.length > limitNum;
    const page = hasMore ? filtered.slice(0, limitNum) : filtered;
    const nextCursor = hasMore && page.length > 0 ? page[page.length - 1].id : null;

    const response: CreatorsTrackingResponse = {
      items: page,
      nextCursor,
      hasMore,
    };

    res.json(response);
  } catch (error) {
    console.error('[GetCreatorsTracking] Erreur:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId: (req as Request & { user?: AuthUser }).user?.id,
    });
    res.status(500).json({
      error: (error as Error).message,
      code: 'INTERNAL_SERVER_ERROR',
    });
  }
};
