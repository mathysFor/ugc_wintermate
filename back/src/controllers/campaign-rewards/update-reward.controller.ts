import type { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../../db/index';
import { campaignRewards, campaigns, brands } from '../../db/schema';
import type { UpdateRewardInput, RewardResponse } from '@shared/types/rewards';
import type { AuthUser } from '@shared/types/auth';

/**
 * Met à jour un palier de récompense
 * @route POST /api/rewards/:id/update
 * @param {UpdateRewardInput} req.body - Données à mettre à jour
 * @returns {RewardResponse} Palier mis à jour
 */
export const updateReward = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as Request & { user?: AuthUser }).user?.id;
    const rewardId = parseInt(req.params.id, 10);

    if (!userId) {
      res.status(401).json({ error: 'Non authentifié', code: 'UNAUTHORIZED' });
      return;
    }

    if (isNaN(rewardId)) {
      res.status(400).json({ error: 'ID invalide', code: 'INVALID_ID' });
      return;
    }

    // Récupérer le palier
    const reward = await db.select().from(campaignRewards).where(eq(campaignRewards.id, rewardId)).limit(1);

    if (!reward[0]) {
      res.status(404).json({ error: 'Palier non trouvé', code: 'REWARD_NOT_FOUND' });
      return;
    }

    // Vérifier que la campagne appartient à l'utilisateur
    const campaign = await db.select().from(campaigns).where(eq(campaigns.id, reward[0].campaignId)).limit(1);

    if (!campaign[0]) {
      res.status(404).json({ error: 'Campagne non trouvée', code: 'CAMPAIGN_NOT_FOUND' });
      return;
    }

    const brand = await db.select().from(brands).where(eq(brands.id, campaign[0].brandId)).limit(1);

    if (!brand[0] || brand[0].userId !== userId) {
      res.status(403).json({ error: 'Non autorisé à modifier ce palier', code: 'FORBIDDEN' });
      return;
    }

    const { viewsTarget, amountEur, allowMultipleVideos }: UpdateRewardInput = req.body;

    const updateData: Partial<typeof campaignRewards.$inferInsert> = {};

    if (viewsTarget !== undefined) updateData.viewsTarget = viewsTarget;
    if (amountEur !== undefined) updateData.amountEur = amountEur;
    if (allowMultipleVideos !== undefined) updateData.allowMultipleVideos = allowMultipleVideos;

    const [updated] = await db
      .update(campaignRewards)
      .set(updateData)
      .where(eq(campaignRewards.id, rewardId))
      .returning();

    const response: RewardResponse = {
      id: updated.id,
      campaignId: updated.campaignId,
      viewsTarget: updated.viewsTarget,
      amountEur: updated.amountEur,
      allowMultipleVideos: updated.allowMultipleVideos,
      createdAt: updated.createdAt.toISOString(),
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message, code: 'INTERNAL_SERVER_ERROR' });
  }
};







