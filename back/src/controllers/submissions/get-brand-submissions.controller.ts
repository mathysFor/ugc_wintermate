import type { Request, Response } from 'express';
import { eq, gt, lt, asc, desc, and, inArray, count, ilike } from 'drizzle-orm';
import { db } from '../../db/index';
import { campaignSubmissions, campaigns, tiktokAccounts, videoStatsCurrent, brands, campaignRewards } from '../../db/schema';
import type { BrandSector } from '@shared/types/brands';
import type { PaginatedSubmissionsResponse, SubmissionWithRelations } from '@shared/types/submissions';
import type { AuthUser } from '@shared/types/auth';

/**
 * Récupère toutes les soumissions des campagnes d'une marque
 * @route GET /api/submissions/brand
 * @param {string} cursor - Cursor pour la pagination
 * @param {number} limit - Nombre d'éléments par page (max 100)
 * @param {string} status - Filtre par statut (pending/accepted/refused)
 * @param {string} campaignId - Filtre par campagne spécifique
 * @param {string} creatorUsername - Filtre par nom d'utilisateur TikTok du créateur
 * @returns {PaginatedSubmissionsResponse} Liste paginée des soumissions
 */
export const getBrandSubmissions = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as Request & { user?: AuthUser }).user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Non authentifié', code: 'UNAUTHORIZED' });
      return;
    }

    // Récupérer la marque de l'utilisateur
    const [brand] = await db.select().from(brands).where(eq(brands.userId, userId)).limit(1);

    if (!brand) {
      res.status(403).json({ error: 'Utilisateur non associé à une marque', code: 'NOT_A_BRAND' });
      return;
    }

    // Récupérer les IDs des campagnes de la marque
    const brandCampaigns = await db
      .select({ id: campaigns.id })
      .from(campaigns)
      .where(eq(campaigns.brandId, brand.id));

    const campaignIds = brandCampaigns.map((c) => c.id);

    if (campaignIds.length === 0) {
      res.json({ items: [], nextCursor: null, hasMore: false, pendingCount: 0 });
      return;
    }

    // Compter les soumissions en attente (indépendamment du filtre)
    const [pendingCountResult] = await db
      .select({ count: count() })
      .from(campaignSubmissions)
      .where(
        and(
          inArray(campaignSubmissions.campaignId, campaignIds),
          eq(campaignSubmissions.status, 'pending')
        )
      );
    const pendingCount = pendingCountResult?.count ?? 0;

    const { cursor, limit = '10', direction = 'next', status, campaignId, creatorUsername } = req.query;
    const limitNum = Math.min(Math.max(parseInt(limit as string, 10) || 10, 1), 100);

    // Construire les conditions
    const conditions: ReturnType<typeof eq>[] = [];

    // Filtre par campagne spécifique ou toutes les campagnes de la marque
    if (campaignId) {
      const campaignIdNum = parseInt(campaignId as string, 10);
      if (!isNaN(campaignIdNum) && campaignIds.includes(campaignIdNum)) {
        conditions.push(eq(campaignSubmissions.campaignId, campaignIdNum));
      } else {
        // Si la campagne demandée n'appartient pas à la marque, retourner vide
        res.json({ items: [], nextCursor: null, hasMore: false, pendingCount });
        return;
      }
    } else {
      conditions.push(inArray(campaignSubmissions.campaignId, campaignIds));
    }

    if (status) {
      conditions.push(eq(campaignSubmissions.status, status as 'pending' | 'accepted' | 'refused'));
    }

    // Filtre par créateur (username TikTok)
    let tiktokAccountIds: number[] | null = null;
    if (creatorUsername) {
      const matchingAccounts = await db
        .select({ id: tiktokAccounts.id })
        .from(tiktokAccounts)
        .where(ilike(tiktokAccounts.username, `%${creatorUsername as string}%`));
      
      tiktokAccountIds = matchingAccounts.map((a) => a.id);
      
      if (tiktokAccountIds.length === 0) {
        // Aucun créateur trouvé avec ce username
        res.json({ items: [], nextCursor: null, hasMore: false, pendingCount });
        return;
      }
      
      conditions.push(inArray(campaignSubmissions.tiktokAccountId, tiktokAccountIds));
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

    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].id : null;

    const response: PaginatedSubmissionsResponse = {
      items: submissionsWithRelations,
      nextCursor,
      hasMore,
      pendingCount,
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message, code: 'INTERNAL_SERVER_ERROR' });
  }
};

