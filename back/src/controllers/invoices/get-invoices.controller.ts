import type { Request, Response } from 'express';
import { eq, gt, lt, asc, desc, and } from 'drizzle-orm';
import { db } from '../../db/index';
import { invoices, campaignSubmissions, campaignRewards, tiktokAccounts, brands, campaigns } from '../../db/schema';
import type { PaginatedInvoicesResponse, InvoiceWithRelations } from '@shared/types/invoices';
import type { AuthUser } from '@shared/types/auth';

/**
 * Récupère les factures de l'utilisateur (créateur) avec pagination
 * @route GET /api/invoices
 * @param {string} cursor - Cursor pour la pagination
 * @param {number} limit - Nombre d'éléments par page
 * @param {string} status - Filtre par statut
 * @returns {PaginatedInvoicesResponse} Liste paginée des factures
 */
export const getInvoices = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as Request & { user?: AuthUser }).user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Non authentifié', code: 'UNAUTHORIZED' });
      return;
    }

    const { cursor, limit = '10', direction = 'next', status } = req.query;
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

    // Récupérer les soumissions de l'utilisateur
    const userSubmissions = await db
      .select()
      .from(campaignSubmissions)
      .where(eq(campaignSubmissions.status, 'accepted'));

    const userSubmissionIds = userSubmissions
      .filter((s) => accountIds.includes(s.tiktokAccountId))
      .map((s) => s.id);

    if (userSubmissionIds.length === 0) {
      res.json({ items: [], nextCursor: null, hasMore: false });
      return;
    }

    // Construire les conditions
    const conditions: ReturnType<typeof eq>[] = [];

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

    let invoiceList = await db
      .select()
      .from(invoices)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(direction === 'next' ? asc(invoices.id) : desc(invoices.id))
      .limit(limitNum + 1);

    // Filtrer par soumissions de l'utilisateur
    invoiceList = invoiceList.filter((inv) => userSubmissionIds.includes(inv.submissionId));

    const hasMore = invoiceList.length > limitNum;
    const items = hasMore ? invoiceList.slice(0, -1) : invoiceList;

    // Récupérer les relations
    const invoicesWithRelations: InvoiceWithRelations[] = await Promise.all(
      items.map(async (invoice) => {
        const [submission] = await db.select().from(campaignSubmissions).where(eq(campaignSubmissions.id, invoice.submissionId)).limit(1);
        const [reward] = await db.select().from(campaignRewards).where(eq(campaignRewards.id, invoice.rewardId)).limit(1);
        const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, submission.campaignId)).limit(1);
        const [brand] = await db.select().from(brands).where(eq(brands.id, campaign.brandId)).limit(1);

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
            id: campaign.id,
            title: campaign.title,
            coverImageUrl: campaign.coverImageUrl,
            brandName: brand.name,
          },
        };
      })
    );

    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].id : null;

    const response: PaginatedInvoicesResponse = {
      items: invoicesWithRelations,
      nextCursor,
      hasMore,
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message, code: 'INTERNAL_SERVER_ERROR' });
  }
};

/**
 * Récupère les factures d'une campagne (pour les marques)
 * @route GET /api/campaigns/:id/invoices
 * @returns {PaginatedInvoicesResponse} Liste des factures de la campagne
 */
export const getCampaignInvoices = async (req: Request, res: Response): Promise<void> => {
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

    // Vérifier que la campagne appartient à l'utilisateur
    const campaign = await db.select().from(campaigns).where(eq(campaigns.id, campaignId)).limit(1);

    if (!campaign[0]) {
      res.status(404).json({ error: 'Campagne non trouvée', code: 'CAMPAIGN_NOT_FOUND' });
      return;
    }

    const brand = await db.select().from(brands).where(eq(brands.id, campaign[0].brandId)).limit(1);

    if (!brand[0] || brand[0].userId !== userId) {
      res.status(403).json({ error: 'Non autorisé à voir ces factures', code: 'FORBIDDEN' });
      return;
    }

    const { cursor, limit = '10', direction = 'next', status } = req.query;
    const limitNum = Math.min(Math.max(parseInt(limit as string, 10) || 10, 1), 100);

    // Récupérer les soumissions de la campagne
    const campaignSubmissionList = await db
      .select()
      .from(campaignSubmissions)
      .where(eq(campaignSubmissions.campaignId, campaignId));

    const submissionIds = campaignSubmissionList.map((s) => s.id);

    if (submissionIds.length === 0) {
      res.json({ items: [], nextCursor: null, hasMore: false });
      return;
    }

    const conditions: ReturnType<typeof eq>[] = [];

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

    let invoiceList = await db
      .select()
      .from(invoices)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(direction === 'next' ? asc(invoices.id) : desc(invoices.id))
      .limit(limitNum + 1);

    // Filtrer par soumissions de la campagne
    invoiceList = invoiceList.filter((inv) => submissionIds.includes(inv.submissionId));

    const hasMore = invoiceList.length > limitNum;
    const items = hasMore ? invoiceList.slice(0, -1) : invoiceList;

    const invoicesWithRelations: InvoiceWithRelations[] = await Promise.all(
      items.map(async (invoice) => {
        const [submission] = await db.select().from(campaignSubmissions).where(eq(campaignSubmissions.id, invoice.submissionId)).limit(1);
        const [reward] = await db.select().from(campaignRewards).where(eq(campaignRewards.id, invoice.rewardId)).limit(1);

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
            id: campaign[0].id,
            title: campaign[0].title,
            coverImageUrl: campaign[0].coverImageUrl,
            brandName: brand[0].name,
          },
        };
      })
    );

    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].id : null;

    res.json({
      items: invoicesWithRelations,
      nextCursor,
      hasMore,
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message, code: 'INTERNAL_SERVER_ERROR' });
  }
};



