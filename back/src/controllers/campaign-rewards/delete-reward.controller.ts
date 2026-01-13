import type { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../../db/index';
import { campaignRewards, campaigns, brands } from '../../db/schema';
import type { AuthUser } from '@shared/types/auth';

/**
 * Supprime un palier de récompense
 * @route POST /api/rewards/:id/delete
 * @returns {object} Message de confirmation
 */
export const deleteReward = async (req: Request, res: Response): Promise<void> => {
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
      res.status(403).json({ error: 'Non autorisé à supprimer ce palier', code: 'FORBIDDEN' });
      return;
    }

    await db.delete(campaignRewards).where(eq(campaignRewards.id, rewardId));

    res.json({ message: 'Palier supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message, code: 'INTERNAL_SERVER_ERROR' });
  }
};









