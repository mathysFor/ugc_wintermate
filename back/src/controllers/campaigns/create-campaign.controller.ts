import type { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../../db/index';
import { campaigns, campaignRewards, brands } from '../../db/schema';
import type { CreateCampaignInput, CampaignWithRelationsResponse } from '@shared/types/campaigns';
import type { BrandSector } from '@shared/types/brands';
import type { AuthUser } from '@shared/types/auth';

/**
 * Crée une nouvelle campagne
 * @route POST /api/campaigns
 * @param {CreateCampaignInput} req.body - Données de la campagne
 * @returns {CampaignWithRelationsResponse} Campagne créée avec ses paliers
 */
export const createCampaign = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as Request & { user?: AuthUser }).user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Non authentifié', code: 'UNAUTHORIZED' });
      return;
    }

    // Récupérer le profil marque de l'utilisateur
    const brand = await db.select().from(brands).where(eq(brands.userId, userId)).limit(1);

    if (!brand[0]) {
      res.status(403).json({ error: 'Profil marque requis', code: 'BRAND_REQUIRED' });
      return;
    }

    const { title, description, coverImageUrl, youtubeUrl, startDate, endDate, rewards }: CreateCampaignInput = req.body;

    if (!title || !description) {
      res.status(400).json({ error: 'Titre et description requis', code: 'FIELDS_REQUIRED' });
      return;
    }

    // Créer la campagne
    const [createdCampaign] = await db
      .insert(campaigns)
      .values({
        brandId: brand[0].id,
        title,
        description,
        coverImageUrl: coverImageUrl ?? null,
        youtubeUrl: youtubeUrl ?? null,
        status: 'draft',
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      })
      .returning();

    // Créer les paliers de récompense si fournis
    let createdRewards: typeof campaignRewards.$inferSelect[] = [];
    if (rewards && rewards.length > 0) {
      createdRewards = await db
        .insert(campaignRewards)
        .values(
          rewards.map((r) => ({
            campaignId: createdCampaign.id,
            viewsTarget: r.viewsTarget,
            amountEur: r.amountEur,
            allowMultipleVideos: r.allowMultipleVideos,
          }))
        )
        .returning();
    }

    const response: CampaignWithRelationsResponse = {
      id: createdCampaign.id,
      brandId: createdCampaign.brandId,
      title: createdCampaign.title,
      description: createdCampaign.description,
      coverImageUrl: createdCampaign.coverImageUrl,
      youtubeUrl: createdCampaign.youtubeUrl,
      status: createdCampaign.status,
      startDate: createdCampaign.startDate?.toISOString() ?? null,
      endDate: createdCampaign.endDate?.toISOString() ?? null,
      createdAt: createdCampaign.createdAt.toISOString(),
      updatedAt: createdCampaign.updatedAt.toISOString(),
      brand: {
        id: brand[0].id,
        userId: brand[0].userId,
        name: brand[0].name,
        sector: brand[0].sector as BrandSector,
        website: brand[0].website,
        logoUrl: brand[0].logoUrl,
        createdAt: brand[0].createdAt.toISOString(),
      },
      rewards: createdRewards.map((r) => ({
        id: r.id,
        campaignId: r.campaignId,
        viewsTarget: r.viewsTarget,
        amountEur: r.amountEur,
        allowMultipleVideos: r.allowMultipleVideos,
        createdAt: r.createdAt.toISOString(),
      })),
    };

    res.status(201).json(response);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message, code: 'INTERNAL_SERVER_ERROR' });
  }
};









