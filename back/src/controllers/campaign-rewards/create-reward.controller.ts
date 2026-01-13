import type { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../../db/index';
import { campaignRewards, campaigns, brands } from '../../db/schema';
import type { CreateRewardInput, RewardResponse } from '@shared/types/rewards';
import type { AuthUser } from '@shared/types/auth';

/**
 * Crée un nouveau palier de récompense pour une campagne
 * @route POST /api/campaigns/:id/rewards
 * @param {CreateRewardInput} req.body - Données du palier
 * @returns {RewardResponse} Palier créé
 */
export const createReward = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as Request & { user?: AuthUser }).user?.id;
    const campaignId = parseInt(req.params.id, 10);

    if (!userId) {
      res.status(401).json({ error: 'Non authentifié', code: 'UNAUTHORIZED' });
      return;
    }

    if (isNaN(campaignId)) {
      res.status(400).json({ error: 'ID de campagne invalide', code: 'INVALID_ID' });
      return;
    }

    // Vérifier que la campagne existe et appartient à l'utilisateur
    const campaign = await db.select().from(campaigns).where(eq(campaigns.id, campaignId)).limit(1);

    if (!campaign[0]) {
      res.status(404).json({ error: 'Campagne non trouvée', code: 'CAMPAIGN_NOT_FOUND' });
      return;
    }

    const brand = await db.select().from(brands).where(eq(brands.id, campaign[0].brandId)).limit(1);

    if (!brand[0] || brand[0].userId !== userId) {
      res.status(403).json({ error: 'Non autorisé à modifier cette campagne', code: 'FORBIDDEN' });
      return;
    }

    const { viewsTarget, amountEur, allowMultipleVideos }: CreateRewardInput = req.body;

    if (viewsTarget === undefined || amountEur === undefined) {
      res.status(400).json({ error: 'viewsTarget et amountEur requis', code: 'FIELDS_REQUIRED' });
      return;
    }

    const [created] = await db
      .insert(campaignRewards)
      .values({
        campaignId,
        viewsTarget,
        amountEur,
        allowMultipleVideos: allowMultipleVideos ?? false,
      })
      .returning();

    const response: RewardResponse = {
      id: created.id,
      campaignId: created.campaignId,
      viewsTarget: created.viewsTarget,
      amountEur: created.amountEur,
      allowMultipleVideos: created.allowMultipleVideos,
      createdAt: created.createdAt.toISOString(),
    };

    res.status(201).json(response);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message, code: 'INTERNAL_SERVER_ERROR' });
  }
};









