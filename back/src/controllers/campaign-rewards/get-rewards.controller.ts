import type { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../../db/index';
import { campaignRewards, campaigns } from '../../db/schema';
import type { RewardsListResponse } from '@shared/types/rewards';

/**
 * Récupère tous les paliers d'une campagne
 * @route GET /api/campaigns/:id/rewards
 * @param {number} id - ID de la campagne
 * @returns {RewardsListResponse} Liste des paliers
 */
export const getRewards = async (req: Request, res: Response): Promise<void> => {
  try {
    const campaignId = parseInt(req.params.id, 10);

    if (isNaN(campaignId)) {
      res.status(400).json({ error: 'ID de campagne invalide', code: 'INVALID_ID' });
      return;
    }

    // Vérifier que la campagne existe
    const campaign = await db.select().from(campaigns).where(eq(campaigns.id, campaignId)).limit(1);

    if (!campaign[0]) {
      res.status(404).json({ error: 'Campagne non trouvée', code: 'CAMPAIGN_NOT_FOUND' });
      return;
    }

    const rewards = await db.select().from(campaignRewards).where(eq(campaignRewards.campaignId, campaignId));

    const response: RewardsListResponse = rewards.map((r) => ({
      id: r.id,
      campaignId: r.campaignId,
      viewsTarget: r.viewsTarget,
      amountEur: r.amountEur,
      allowMultipleVideos: r.allowMultipleVideos,
      createdAt: r.createdAt.toISOString(),
    }));

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message, code: 'INTERNAL_SERVER_ERROR' });
  }
};









