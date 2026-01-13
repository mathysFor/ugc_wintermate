import type { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../../db/index';
import { campaigns, campaignRewards, brands } from '../../db/schema';
import type { CampaignWithRelationsResponse } from '@shared/types/campaigns';
import type { BrandSector } from '@shared/types/brands';

/**
 * Récupère une campagne par ID avec ses relations
 * @route GET /api/campaigns/:id
 * @param {number} id - ID de la campagne
 * @returns {CampaignWithRelationsResponse} Campagne avec marque et paliers
 */
export const getCampaign = async (req: Request, res: Response): Promise<void> => {
  try {
    const campaignId = parseInt(req.params.id, 10);

    if (isNaN(campaignId)) {
      res.status(400).json({ error: 'ID invalide', code: 'INVALID_ID' });
      return;
    }

    const campaign = await db.select().from(campaigns).where(eq(campaigns.id, campaignId)).limit(1);

    if (!campaign[0]) {
      res.status(404).json({ error: 'Campagne non trouvée', code: 'CAMPAIGN_NOT_FOUND' });
      return;
    }

    // Récupérer la marque
    const brand = await db.select().from(brands).where(eq(brands.id, campaign[0].brandId)).limit(1);

    if (!brand[0]) {
      res.status(404).json({ error: 'Marque non trouvée', code: 'BRAND_NOT_FOUND' });
      return;
    }

    // Récupérer les paliers
    const rewards = await db.select().from(campaignRewards).where(eq(campaignRewards.campaignId, campaignId));

    const response: CampaignWithRelationsResponse = {
      id: campaign[0].id,
      brandId: campaign[0].brandId,
      title: campaign[0].title,
      description: campaign[0].description,
      coverImageUrl: campaign[0].coverImageUrl,
      youtubeUrl: campaign[0].youtubeUrl,
      status: campaign[0].status,
      startDate: campaign[0].startDate?.toISOString() ?? null,
      endDate: campaign[0].endDate?.toISOString() ?? null,
      createdAt: campaign[0].createdAt.toISOString(),
      updatedAt: campaign[0].updatedAt.toISOString(),
      brand: {
        id: brand[0].id,
        userId: brand[0].userId,
        name: brand[0].name,
        sector: brand[0].sector as BrandSector,
        website: brand[0].website,
        logoUrl: brand[0].logoUrl,
        createdAt: brand[0].createdAt.toISOString(),
      },
      rewards: rewards.map((r) => ({
        id: r.id,
        campaignId: r.campaignId,
        viewsTarget: r.viewsTarget,
        amountEur: r.amountEur,
        allowMultipleVideos: r.allowMultipleVideos,
        createdAt: r.createdAt.toISOString(),
      })),
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message, code: 'INTERNAL_SERVER_ERROR' });
  }
};









