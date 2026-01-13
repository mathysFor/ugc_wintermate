import type { Request, Response } from 'express';
import { eq, gt, lt, desc, asc, sql, and } from 'drizzle-orm';
import { db } from '../../db/index';
import { users, referralCommissions } from '../../db/schema';
import type { PaginatedRefereesResponse, Referee } from '@shared/types/referral';
import type { AuthUser } from '@shared/types/auth';

/**
 * Récupère la liste des filleuls du créateur connecté
 * @route GET /api/referral/referees
 * @param {string} cursor - Cursor pour la pagination
 * @param {number} limit - Nombre d'éléments par page (max 100)
 * @param {string} direction - Direction de pagination ('next' | 'prev')
 * @returns {PaginatedRefereesResponse} Liste paginée des filleuls
 */
export const getReferees = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as Request & { user?: AuthUser }).user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Non authentifié', code: 'UNAUTHORIZED' });
      return;
    }

    const { cursor, limit = '10', direction = 'next' } = req.query;
    const parsedLimit = Math.min(Math.max(1, parseInt(limit as string, 10) || 10), 100);

    // Construire la condition where
    let whereCondition = eq(users.referredById, userId);

    // Appliquer le cursor si présent
    if (cursor) {
      const cursorId = parseInt(cursor as string, 10);
      if (!isNaN(cursorId)) {
        if (direction === 'next') {
          whereCondition = and(eq(users.referredById, userId), gt(users.id, cursorId))!;
        } else {
          whereCondition = and(eq(users.referredById, userId), lt(users.id, cursorId))!;
        }
      }
    }

    // Exécuter la requête
    const results = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        isCreator: users.isCreator,
        isBrand: users.isBrand,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(whereCondition)
      .orderBy(direction === 'next' ? asc(users.id) : desc(users.id))
      .limit(parsedLimit + 1);

    const hasMore = results.length > parsedLimit;
    const items = hasMore ? results.slice(0, -1) : results;
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].id : null;

    // Récupérer le total des commissions pour chaque filleul
    const refereesWithCommissions: Referee[] = await Promise.all(
      items.map(async (referee) => {
        const commissionsResult = await db
          .select({ total: sql<number>`COALESCE(SUM(amount_eur), 0)::int` })
          .from(referralCommissions)
          .where(sql`${referralCommissions.referrerId} = ${userId} AND ${referralCommissions.refereeId} = ${referee.id}`);

        return {
          id: referee.id,
          email: referee.email,
          firstName: referee.firstName,
          lastName: referee.lastName,
          isCreator: referee.isCreator,
          isBrand: referee.isBrand,
          createdAt: referee.createdAt.toISOString(),
          totalCommissions: commissionsResult[0]?.total ?? 0,
        };
      })
    );

    const response: PaginatedRefereesResponse = {
      items: refereesWithCommissions,
      nextCursor,
      hasMore,
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message, code: 'INTERNAL_SERVER_ERROR' });
  }
};

