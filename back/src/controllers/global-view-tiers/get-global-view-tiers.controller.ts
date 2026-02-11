import type { Request, Response } from 'express';
import { asc } from 'drizzle-orm';
import { db } from '../../db/index';
import { globalViewTiers } from '../../db/schema';
import type { GlobalViewTiersResponse } from '@shared/types/global-view-tiers';

/**
 * Récupère la liste des paliers globaux de vues
 * @route GET /api/global-view-tiers
 * @returns {GlobalViewTiersResponse} Liste des paliers globaux
 */
export const getGlobalViewTiers = async (req: Request, res: Response): Promise<void> => {
  try {
    const tiers = await db
      .select()
      .from(globalViewTiers)
      .orderBy(asc(globalViewTiers.viewsTarget));

    const response: GlobalViewTiersResponse = tiers.map((tier) => ({
      id: tier.id,
      viewsTarget: tier.viewsTarget,
      rewardLabel: tier.rewardLabel,
      createdAt: tier.createdAt.toISOString(),
      updatedAt: tier.updatedAt.toISOString(),
    }));

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message, code: 'INTERNAL_SERVER_ERROR' });
  }
};
