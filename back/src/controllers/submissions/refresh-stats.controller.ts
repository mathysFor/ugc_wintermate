import type { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../../db/index';
import { brands } from '../../db/schema';
import { manualRefresh } from '../../cron/stats-refresh.cron';
import type { AuthUser } from '@shared/types/auth';
import type { RefreshStatsResponse } from '@shared/types/submissions';

/**
 * Déclenche un refresh manuel des statistiques TikTok
 * @route POST /api/submissions/refresh-stats
 * @returns {RefreshStatsResponse} Message de succès
 */
export const refreshStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as Request & { user?: AuthUser }).user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Non authentifié', code: 'UNAUTHORIZED' });
      return;
    }

    // Vérifier que l'utilisateur est une marque
    const [brand] = await db.select().from(brands).where(eq(brands.userId, userId)).limit(1);

    if (!brand) {
      res.status(403).json({ error: 'Utilisateur non associé à une marque', code: 'NOT_A_BRAND' });
      return;
    }

    console.log(`[REFRESH] Refresh manuel déclenché par la marque ${brand.name} (user ${userId})`);

    await manualRefresh();

    const response: RefreshStatsResponse = {
      success: true,
      updated: 0,
      message: 'Statistiques TikTok mises à jour.',
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message, code: 'INTERNAL_SERVER_ERROR' });
  }
};







