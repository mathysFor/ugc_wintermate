import type { Request, Response } from 'express';
import { eq, gt, lt, asc, desc, and, inArray, count } from 'drizzle-orm';
import { db } from '../../db/index';
import { invoices, campaignSubmissions, campaignRewards, tiktokAccounts, brands, campaigns } from '../../db/schema';
import type { PaginatedInvoicesResponse, InvoiceWithRelations, AdsCodesStatus } from '@shared/types/invoices';
import type { AuthUser } from '@shared/types/auth';

/**
 * Récupère toutes les factures des campagnes d'une marque
 * @route GET /api/invoices/brand
 * @param {string} cursor - Cursor pour la pagination
 * @param {number} limit - Nombre d'éléments par page (max 100)
 * @param {string} status - Filtre par statut (uploaded/paid)
 * @returns {PaginatedInvoicesResponse} Liste paginée des factures
 */
export const getBrandInvoices = async (req: Request, res: Response): Promise<void> => {
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
      .select({ id: campaigns.id, title: campaigns.title, coverImageUrl: campaigns.coverImageUrl })
      .from(campaigns)
      .where(eq(campaigns.brandId, brand.id));

    const campaignIds = brandCampaigns.map((c) => c.id);

    if (campaignIds.length === 0) {
      res.json({ items: [], nextCursor: null, hasMore: false, pendingCount: 0 });
      return;
    }

    // Récupérer les soumissions des campagnes de la marque
    const brandSubmissions = await db
      .select()
      .from(campaignSubmissions)
      .where(inArray(campaignSubmissions.campaignId, campaignIds));

    const submissionIds = brandSubmissions.map((s) => s.id);

    if (submissionIds.length === 0) {
      res.json({ items: [], nextCursor: null, hasMore: false, pendingCount: 0 });
      return;
    }

    // Compter les factures en attente de paiement (indépendamment du filtre)
    const [pendingCountResult] = await db
      .select({ count: count() })
      .from(invoices)
      .where(
        and(
          inArray(invoices.submissionId, submissionIds),
          eq(invoices.status, 'uploaded')
        )
      );
    const pendingCount = pendingCountResult?.count ?? 0;

    const { cursor, limit = '10', direction = 'next', status } = req.query;
    const limitNum = Math.min(Math.max(parseInt(limit as string, 10) || 10, 1), 100);

    // Construire les conditions
    const conditions: ReturnType<typeof eq>[] = [inArray(invoices.submissionId, submissionIds)];

    if (status) {
      conditions.push(eq(invoices.status, status as 'uploaded' | 'paid'));
    }

    if (cursor) {
      const cursorNum = parseInt(cursor as string, 10);
      if (!isNaN(cursorNum)) {
        if (direction === 'next') {
          conditions.push(gt(invoices.id, cursorNum));
        } else {
          conditions.push(lt(invoices.id, cursorNum));
        }
      }
    }

    const invoiceList = await db
      .select()
      .from(invoices)
      .where(and(...conditions))
      .orderBy(direction === 'next' ? asc(invoices.id) : desc(invoices.id))
      .limit(limitNum + 1);

    const hasMore = invoiceList.length > limitNum;
    const items = hasMore ? invoiceList.slice(0, -1) : invoiceList;

    // Récupérer les relations
    const invoicesWithRelations: InvoiceWithRelations[] = (
      await Promise.all(
        items.map(async (invoice) => {
          const [submission] = await db.select().from(campaignSubmissions).where(eq(campaignSubmissions.id, invoice.submissionId)).limit(1);
          const [reward] = await db.select().from(campaignRewards).where(eq(campaignRewards.id, invoice.rewardId)).limit(1);

          if (!submission || !reward) return null;

          const campaign = brandCampaigns.find((c) => c.id === submission.campaignId);
          const [tiktokAccount] = await db.select().from(tiktokAccounts).where(eq(tiktokAccounts.id, submission.tiktokAccountId)).limit(1);

          if (!tiktokAccount) return null;

          // Récupérer tous les comptes TikTok du créateur (via userId du compte TikTok de la soumission)
          const creatorTiktokAccounts = await db
            .select()
            .from(tiktokAccounts)
            .where(eq(tiktokAccounts.userId, tiktokAccount.userId));

        const creatorAccountIds = creatorTiktokAccounts.map((a) => a.id);

        // Récupérer toutes les soumissions acceptées du créateur pour cette campagne
        const creatorAcceptedSubmissions = await db
          .select()
          .from(campaignSubmissions)
          .where(
            and(
              eq(campaignSubmissions.campaignId, submission.campaignId),
              eq(campaignSubmissions.status, 'accepted'),
              inArray(campaignSubmissions.tiktokAccountId, creatorAccountIds)
            )
          );

        // Récupérer les usernames des comptes TikTok
        const accountsMap = new Map(creatorTiktokAccounts.map((a) => [a.id, a.username]));

        // Calculer le statut des codes d'ads
        const adsCodesStatus: AdsCodesStatus = {
          totalVideos: creatorAcceptedSubmissions.length,
          videosWithAdsCode: creatorAcceptedSubmissions.filter((s) => s.adsCode && s.adsCode.trim() !== '').length,
          videos: creatorAcceptedSubmissions.map((s) => ({
            submissionId: s.id,
            tiktokVideoId: s.tiktokVideoId,
            tiktokUsername: accountsMap.get(s.tiktokAccountId) ?? 'inconnu',
            hasAdsCode: !!s.adsCode && s.adsCode.trim() !== '',
            adsCode: s.adsCode,
          })),
        };

        return {
          id: invoice.id,
          submissionId: invoice.submissionId,
          rewardId: invoice.rewardId,
          pdfUrl: invoice.pdfUrl,
          paymentMethod: invoice.paymentMethod,
          status: invoice.status,
          uploadedAt: invoice.uploadedAt.toISOString(),
          paidAt: invoice.paidAt?.toISOString() ?? null,
          submission: {
            id: submission.id,
            campaignId: submission.campaignId,
            tiktokAccountId: submission.tiktokAccountId,
            tiktokVideoId: submission.tiktokVideoId,
            coverImageUrl: submission.coverImageUrl ?? null,
            status: submission.status,
            submittedAt: submission.submittedAt.toISOString(),
            validatedAt: submission.validatedAt?.toISOString() ?? null,
            refuseReason: submission.refuseReason,
            adsCode: submission.adsCode ?? null,
          },
          reward: {
            id: reward.id,
            campaignId: reward.campaignId,
            viewsTarget: reward.viewsTarget,
            amountEur: reward.amountEur,
            allowMultipleVideos: reward.allowMultipleVideos,
            createdAt: reward.createdAt.toISOString(),
          },
          campaign: {
            id: campaign?.id ?? submission.campaignId,
            title: campaign?.title ?? 'Campagne inconnue',
            coverImageUrl: campaign?.coverImageUrl ?? null,
            brandName: brand.name,
          },
          creatorUsername: tiktokAccount.username,
          adsCodesStatus,
        };
        })
      )
    ).filter((inv): inv is InvoiceWithRelations => inv !== null);

    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].id : null;

    const response: PaginatedInvoicesResponse = {
      items: invoicesWithRelations,
      nextCursor,
      hasMore,
      pendingCount,
    };

    res.json(response);
  } catch (error) {
    console.error('[getBrandInvoices]', error);
    res.status(500).json({ error: (error as Error).message, code: 'INTERNAL_SERVER_ERROR' });
  }
};
