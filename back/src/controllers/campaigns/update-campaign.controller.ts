import type { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../../db/index';
import { campaigns, campaignRewards, brands, users } from '../../db/schema';
import type { UpdateCampaignInput, CampaignWithRelationsResponse } from '@shared/types/campaigns';
import type { BrandSector } from '@shared/types/brands';
import type { AuthUser } from '@shared/types/auth';
import { notificationService } from '../../services/notifications.service';

/**
 * Met à jour une campagne
 * @route POST /api/campaigns/:id/update
 * @param {UpdateCampaignInput} req.body - Données à mettre à jour
 * @returns {CampaignWithRelationsResponse} Campagne mise à jour
 */
export const updateCampaign = async (req: Request, res: Response): Promise<void> => {
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
      res.status(403).json({ error: 'Non autorisé à modifier cette campagne', code: 'FORBIDDEN' });
      return;
    }

    const { title, description, coverImageUrl, youtubeUrl, status, startDate, endDate }: UpdateCampaignInput = req.body;

    const updateData: Partial<typeof campaigns.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (coverImageUrl !== undefined) updateData.coverImageUrl = coverImageUrl;
    if (youtubeUrl !== undefined) updateData.youtubeUrl = youtubeUrl;
    if (status !== undefined) updateData.status = status;
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;

    // Sauvegarder l'ancien statut pour détecter le passage à 'active'
    const previousStatus = campaign[0].status;

    const [updated] = await db
      .update(campaigns)
      .set(updateData)
      .where(eq(campaigns.id, campaignId))
      .returning();

    // Récupérer les paliers
    const rewards = await db.select().from(campaignRewards).where(eq(campaignRewards.campaignId, campaignId));

    // Si la campagne vient d'être publiée (passage à 'active')
    if (status === 'active' && previousStatus !== 'active') {
      // 1. Notifier tous les créateurs
      const allCreators = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.isCreator, true));

      for (const creator of allCreators) {
        notificationService.notify(
          'campaign_published',
          creator.id,
          { campaignTitle: updated.title, brandName: brand[0].name },
          { campaignId: updated.id, brandId: brand[0].id }
        ).catch((error) => {
          console.error('[UpdateCampaign] Erreur notification créateur:', (error as Error).message);
        });
      }

      // 2. Notifier la marque propriétaire (confirmation)
      notificationService.notify(
        'campaign_published_brand',
        brand[0].userId,
        { campaignTitle: updated.title },
        { campaignId: updated.id }
      ).catch((error) => {
        console.error('[UpdateCampaign] Erreur notification marque:', (error as Error).message);
      });
    }

    const response: CampaignWithRelationsResponse = {
      id: updated.id,
      brandId: updated.brandId,
      title: updated.title,
      description: updated.description,
      coverImageUrl: updated.coverImageUrl,
      youtubeUrl: updated.youtubeUrl,
      status: updated.status,
      startDate: updated.startDate?.toISOString() ?? null,
      endDate: updated.endDate?.toISOString() ?? null,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
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



