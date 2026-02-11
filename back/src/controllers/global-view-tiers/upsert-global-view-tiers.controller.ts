import type { Request, Response } from 'express';
import { asc } from 'drizzle-orm';
import { db } from '../../db/index';
import { globalViewTiers } from '../../db/schema';
import type { UpsertGlobalViewTiersInput, GlobalViewTiersResponse } from '@shared/types/global-view-tiers';
import type { AuthUser } from '@shared/types/auth';

/**
 * Remplace la liste des paliers globaux de vues
 * @route POST /api/global-view-tiers
 * @param {UpsertGlobalViewTiersInput} req.body - Liste des paliers globaux
 * @returns {GlobalViewTiersResponse} Liste mise à jour
 */
export const upsertGlobalViewTiers = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as Request & { user?: AuthUser }).user;

    if (!user) {
      res.status(401).json({ error: 'Non authentifié', code: 'UNAUTHORIZED' });
      return;
    }

    if (!user.isBrand) {
      res.status(403).json({ error: 'Non autorisé', code: 'FORBIDDEN' });
      return;
    }

    const { tiers } = (req.body as UpsertGlobalViewTiersInput) ?? {};

    if (!Array.isArray(tiers)) {
      res.status(400).json({ error: 'Liste de paliers invalide', code: 'INVALID_PAYLOAD' });
      return;
    }

    const sanitized = tiers
      .map((tier) => ({
        viewsTarget: Number(tier.viewsTarget),
        rewardLabel: String(tier.rewardLabel ?? '').trim(),
      }))
      .filter((tier) => Number.isFinite(tier.viewsTarget) && tier.viewsTarget > 0 && tier.rewardLabel.length > 0);

    if (sanitized.length === 0) {
      res.status(400).json({ error: 'Aucun palier valide', code: 'INVALID_TIERS' });
      return;
    }

    await db.delete(globalViewTiers);

    const inserted = await db
      .insert(globalViewTiers)
      .values(sanitized)
      .returning();

    const sorted = inserted.sort((a, b) => a.viewsTarget - b.viewsTarget);

    const response: GlobalViewTiersResponse = sorted.map((tier) => ({
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
