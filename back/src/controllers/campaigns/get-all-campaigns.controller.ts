import type { Request, Response } from 'express';
import { eq, gt, lt, desc, asc, and, ne } from 'drizzle-orm';
import { db } from '../../db/index';
import { campaigns, campaignRewards, brands } from '../../db/schema';
import type { PaginatedCampaignsResponse, CampaignWithRelations } from '@shared/types/campaigns';
import type { BrandSector } from '@shared/types/brands';

/**
 * Récupère toutes les campagnes actives avec pagination par cursor
 * @route GET /api/campaigns
 * @param {string} cursor - Cursor pour la pagination
 * @param {number} limit - Nombre d'éléments par page (max 100)
 * @param {string} direction - Direction de pagination ('next' | 'prev')
 * @param {string} status - Filtre par statut (optionnel, défaut: 'active')
 * @returns {PaginatedCampaignsResponse} Liste paginée des campagnes
 */
export const getAllCampaigns = async (req: Request, res: Response): Promise<void> => {
  try {
    const { cursor, limit = '10', direction = 'next', status = 'all' } = req.query;
    const limitNum = Math.min(Math.max(parseInt(limit as string, 10) || 10, 1), 100);

    // Construire la requête de base
    let query = db.select().from(campaigns);

    // Filtrer par statut (exclure les campagnes supprimées)
    const conditions = [ne(campaigns.status, 'deleted')];

    if (status && status !== 'all') {
      conditions.push(eq(campaigns.status, status as 'draft' | 'active' | 'paused' | 'deleted'));
    }

    // Pagination par cursor
    if (cursor) {
      const cursorNum = parseInt(cursor as string, 10);
      if (!isNaN(cursorNum)) {
        if (direction === 'next') {
          conditions.push(gt(campaigns.id, cursorNum));
        } else {
          conditions.push(lt(campaigns.id, cursorNum));
        }
      }
    }

    const results = await query
      .where(and(...conditions))
      .orderBy(direction === 'next' ? asc(campaigns.id) : desc(campaigns.id))
      .limit(limitNum + 1);

    const hasMore = results.length > limitNum;
    const items = hasMore ? results.slice(0, -1) : results;

    // Récupérer les marques et paliers pour chaque campagne
    const campaignsWithRelations: CampaignWithRelations[] = await Promise.all(
      items.map(async (campaign) => {
        const [brand] = await db.select().from(brands).where(eq(brands.id, campaign.brandId)).limit(1);
        const rewards = await db.select().from(campaignRewards).where(eq(campaignRewards.campaignId, campaign.id));

        return {
          id: campaign.id,
          brandId: campaign.brandId,
          title: campaign.title,
          description: campaign.description,
          coverImageUrl: campaign.coverImageUrl,
          youtubeUrl: campaign.youtubeUrl,
          status: campaign.status,
          startDate: campaign.startDate?.toISOString() ?? null,
          endDate: campaign.endDate?.toISOString() ?? null,
          createdAt: campaign.createdAt.toISOString(),
          updatedAt: campaign.updatedAt.toISOString(),
          brand: {
            id: brand.id,
            userId: brand.userId,
            name: brand.name,
            sector: brand.sector as BrandSector,
            website: brand.website,
            logoUrl: brand.logoUrl,
            createdAt: brand.createdAt.toISOString(),
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
      })
    );

    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].id : null;

    const response: PaginatedCampaignsResponse = {
      items: campaignsWithRelations,
      nextCursor,
      hasMore,
    };

    res.json(response);
  } catch (error) {
    console.error('[GetAllCampaigns] Erreur:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      query: req.query,
    });
    res.status(500).json({ error: (error as Error).message, code: 'INTERNAL_SERVER_ERROR' });
  }
};


