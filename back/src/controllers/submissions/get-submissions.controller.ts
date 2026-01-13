import type { Request, Response } from 'express';
import { eq, gt, lt, asc, desc, and } from 'drizzle-orm';
import { db } from '../../db/index';
import { campaignSubmissions, campaigns, tiktokAccounts, videoStatsCurrent, brands, campaignRewards } from '../../db/schema';
import type { BrandSector } from '@shared/types/brands';
import type { PaginatedSubmissionsResponse, SubmissionWithRelations } from '@shared/types/submissions';
import type { AuthUser } from '@shared/types/auth';

/**
 * Récupère les soumissions avec pagination par cursor
 * @route GET /api/submissions
 * @param {string} cursor - Cursor pour la pagination
 * @param {number} limit - Nombre d'éléments par page
 * @param {string} campaignId - Filtre par campagne (optionnel)
 * @param {string} status - Filtre par statut (optionnel)
 * @returns {PaginatedSubmissionsResponse} Liste paginée des soumissions
 */
export const getSubmissions = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as Request & { user?: AuthUser }).user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Non authentifié', code: 'UNAUTHORIZED' });
      return;
    }

    const { cursor, limit = '10', direction = 'next', campaignId, status } = req.query;
    const limitNum = Math.min(Math.max(parseInt(limit as string, 10) || 10, 1), 100);

    // Récupérer les comptes TikTok de l'utilisateur
    const userTiktokAccounts = await db
      .select()
      .from(tiktokAccounts)
      .where(eq(tiktokAccounts.userId, userId));

    const accountIds = userTiktokAccounts.map((a) => a.id);

    if (accountIds.length === 0) {
      res.json({ items: [], nextCursor: null, hasMore: false });
      return;
    }

    // Construire les conditions
    const conditions: ReturnType<typeof eq>[] = [];

    if (campaignId) {
      const campaignIdNum = parseInt(campaignId as string, 10);
      if (!isNaN(campaignIdNum)) {
        conditions.push(eq(campaignSubmissions.campaignId, campaignIdNum));
      }
    }

    if (status) {
      conditions.push(eq(campaignSubmissions.status, status as 'pending' | 'accepted' | 'refused'));
    }

    if (cursor) {
      const cursorNum = parseInt(cursor as string, 10);
      if (!isNaN(cursorNum)) {
        if (direction === 'next') {
          conditions.push(gt(campaignSubmissions.id, cursorNum));
        } else {
          conditions.push(lt(campaignSubmissions.id, cursorNum));
        }
      }
    }

    // Récupérer les soumissions de l'utilisateur
    let submissions = await db
      .select()
      .from(campaignSubmissions)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(direction === 'next' ? asc(campaignSubmissions.id) : desc(campaignSubmissions.id))
      .limit(limitNum + 1);

    // Filtrer par comptes TikTok de l'utilisateur
    submissions = submissions.filter((s) => accountIds.includes(s.tiktokAccountId));

    const hasMore = submissions.length > limitNum;
    const items = hasMore ? submissions.slice(0, -1) : submissions;

    // Récupérer les relations
    const submissionsWithRelations: SubmissionWithRelations[] = await Promise.all(
      items.map(async (submission) => {
        const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, submission.campaignId)).limit(1);
        const [tiktokAccount] = await db.select().from(tiktokAccounts).where(eq(tiktokAccounts.id, submission.tiktokAccountId)).limit(1);
        const [stats] = await db.select().from(videoStatsCurrent).where(eq(videoStatsCurrent.submissionId, submission.id)).limit(1);

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

    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].id : null;

    const response: PaginatedSubmissionsResponse = {
      items: submissionsWithRelations,
      nextCursor,
      hasMore,
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message, code: 'INTERNAL_SERVER_ERROR' });
  }
};

/**
 * Récupère les soumissions d'une campagne (pour les marques)
 * @route GET /api/campaigns/:id/submissions
 * @returns {PaginatedSubmissionsResponse} Liste des soumissions de la campagne
 */
export const getCampaignSubmissions = async (req: Request, res: Response): Promise<void> => {
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

    // Vérifier que la campagne appartient à l'utilisateur (marque)
    const campaign = await db.select().from(campaigns).where(eq(campaigns.id, campaignId)).limit(1);

    if (!campaign[0]) {
      res.status(404).json({ error: 'Campagne non trouvée', code: 'CAMPAIGN_NOT_FOUND' });
      return;
    }

    const brand = await db.select().from(brands).where(eq(brands.id, campaign[0].brandId)).limit(1);

    if (!brand[0] || brand[0].userId !== userId) {
      res.status(403).json({ error: 'Non autorisé à voir ces soumissions', code: 'FORBIDDEN' });
      return;
    }

    const { cursor, limit = '10', direction = 'next', status } = req.query;
    const limitNum = Math.min(Math.max(parseInt(limit as string, 10) || 10, 1), 100);

    const conditions = [eq(campaignSubmissions.campaignId, campaignId)];

    if (status) {
      conditions.push(eq(campaignSubmissions.status, status as 'pending' | 'accepted' | 'refused'));
    }

    if (cursor) {
      const cursorNum = parseInt(cursor as string, 10);
      if (!isNaN(cursorNum)) {
        if (direction === 'next') {
          conditions.push(gt(campaignSubmissions.id, cursorNum));
        } else {
          conditions.push(lt(campaignSubmissions.id, cursorNum));
        }
      }
    }

    const submissions = await db
      .select()
      .from(campaignSubmissions)
      .where(and(...conditions))
      .orderBy(direction === 'next' ? asc(campaignSubmissions.id) : desc(campaignSubmissions.id))
      .limit(limitNum + 1);

    const hasMore = submissions.length > limitNum;
    const items = hasMore ? submissions.slice(0, -1) : submissions;

    const submissionsWithRelations: SubmissionWithRelations[] = await Promise.all(
      items.map(async (submission) => {
        const [tiktokAccount] = await db.select().from(tiktokAccounts).where(eq(tiktokAccounts.id, submission.tiktokAccountId)).limit(1);
        const [stats] = await db.select().from(videoStatsCurrent).where(eq(videoStatsCurrent.submissionId, submission.id)).limit(1);

        // Récupérer brand et rewards pour la campagne
        const [brand] = await db.select().from(brands).where(eq(brands.id, campaign[0].brandId)).limit(1);
        const rewards = await db.select().from(campaignRewards).where(eq(campaignRewards.campaignId, campaign[0].id));

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
          campaign: {
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

    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].id : null;

    res.json({
      items: submissionsWithRelations,
      nextCursor,
      hasMore,
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message, code: 'INTERNAL_SERVER_ERROR' });
  }
};



