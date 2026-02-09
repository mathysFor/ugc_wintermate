import type { Request, Response } from 'express';
import { eq, and } from 'drizzle-orm';
import { db } from '../../db/index';
import { campaignSubmissions, campaigns, tiktokAccounts, videoStatsCurrent, brands, campaignRewards } from '../../db/schema';
import type { BrandSector } from '@shared/types/brands';
import type { PaginatedSubmissionsResponse, SubmissionWithRelations } from '@shared/types/submissions';

/**
 * Récupère les soumissions approuvées d'une campagne (endpoint public)
 * @route GET /api/campaigns/:id/submissions/public
 * @param {string} id - ID de la campagne
 * @returns {PaginatedSubmissionsResponse} Liste des soumissions approuvées avec stats
 */
export const getPublicCampaignSubmissions = async (req: Request, res: Response): Promise<void> => {
  try {
    const campaignId = parseInt(req.params.id, 10);

    if (isNaN(campaignId)) {
      res.status(400).json({ error: 'ID de campagne invalide', code: 'INVALID_ID' });
      return;
    }

    // Vérifier que la campagne existe
    const [campaign] = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, campaignId))
      .limit(1);

    if (!campaign) {
      res.status(404).json({ error: 'Campagne non trouvée', code: 'CAMPAIGN_NOT_FOUND' });
      return;
    }

    // Récupérer uniquement les soumissions acceptées et visibles dans la communauté
    const submissions = await db
      .select()
      .from(campaignSubmissions)
      .where(
        and(
          eq(campaignSubmissions.campaignId, campaignId),
          eq(campaignSubmissions.status, 'accepted'),
          eq(campaignSubmissions.visibleInCommunity, true)
        )
      );

    // Récupérer les relations pour chaque soumission
    const submissionsWithRelations: SubmissionWithRelations[] = await Promise.all(
      submissions.map(async (submission) => {
        const [tiktokAccount] = await db
          .select()
          .from(tiktokAccounts)
          .where(eq(tiktokAccounts.id, submission.tiktokAccountId))
          .limit(1);

        const [stats] = await db
          .select()
          .from(videoStatsCurrent)
          .where(eq(videoStatsCurrent.submissionId, submission.id))
          .limit(1);

        // Récupérer brand et rewards pour la campagne
        const [brand] = await db.select().from(brands).where(eq(brands.id, campaign.brandId)).limit(1);
        const rewards = await db.select().from(campaignRewards).where(eq(campaignRewards.campaignId, campaign.id));

        return {
          id: submission.id,
          campaignId: submission.campaignId,
          tiktokAccountId: submission.tiktokAccountId,
          tiktokVideoId: submission.tiktokVideoId,
          coverImageUrl: submission.coverImageUrl,
          status: submission.status,
          submittedAt: submission.submittedAt.toISOString(),
          validatedAt: submission.validatedAt?.toISOString() ?? null,
          refuseReason: submission.refuseReason,
          adsCode: submission.adsCode,
          visibleInCommunity: submission.visibleInCommunity,
          campaign: {
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
            rewards: rewards.map(r => ({
              id: r.id,
              campaignId: r.campaignId,
              viewsTarget: r.viewsTarget,
              amountEur: r.amountEur,
              allowMultipleVideos: r.allowMultipleVideos,
              createdAt: r.createdAt.toISOString(),
            })),
          },
          tiktokAccount: {
            id: tiktokAccount.id,
            userId: tiktokAccount.userId,
            tiktokUserId: tiktokAccount.tiktokUserId,
            username: tiktokAccount.username,
            isValid: tiktokAccount.isValid,
            expiresAt: tiktokAccount.expiresAt.toISOString(),
            createdAt: tiktokAccount.createdAt.toISOString(),
          },
          currentStats: stats
            ? {
                views: stats.views,
                likes: stats.likes,
                comments: stats.comments,
                shares: stats.shares,
                updatedAt: stats.updatedAt.toISOString(),
              }
            : undefined,
        };
      })
    );

    const response: PaginatedSubmissionsResponse = {
      items: submissionsWithRelations,
      nextCursor: null,
      hasMore: false,
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message, code: 'INTERNAL_SERVER_ERROR' });
  }
};

