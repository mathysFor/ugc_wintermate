import type { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../../db/index';
import { campaigns, brands } from '../../db/schema';
import type { AuthUser } from '@shared/types/auth';

/**
 * Supprime une campagne (soft delete - change le statut à 'deleted')
 * @route POST /api/campaigns/:id/delete
 * @returns {object} Message de confirmation
 */
export const deleteCampaign = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as Request & { user?: AuthUser }).user?.id;
    const campaignId = parseInt(req.params.id, 10);

    if (!userId) {
      res.status(401).json({ error: 'Non authentifié', code: 'UNAUTHORIZED' });
      return;
    }

    if (isNaN(campaignId)) {
      res.status(400).json({ error: 'ID invalide', code: 'INVALID_ID' });
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
      res.status(403).json({ error: 'Non autorisé à supprimer cette campagne', code: 'FORBIDDEN' });
      return;
    }

    // Soft delete - changer le statut à 'deleted'
    await db
      .update(campaigns)
      .set({ status: 'deleted', updatedAt: new Date() })
      .where(eq(campaigns.id, campaignId));

    res.json({ message: 'Campagne supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message, code: 'INTERNAL_SERVER_ERROR' });
  }
};









