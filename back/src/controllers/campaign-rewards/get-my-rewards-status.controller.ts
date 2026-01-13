import type { Request, Response } from 'express';
import { eq, and, inArray } from 'drizzle-orm';
import { db } from '../../db/index';
import {
  campaignRewards,
  campaigns,
  campaignSubmissions,
  tiktokAccounts,
  videoStatsCurrent,
  invoices,
} from '../../db/schema';
import type { RewardsStatusResponse, RewardStatus } from '@shared/types/rewards';
import type { AuthUser } from '@shared/types/auth';

/**
 * Récupère l'état des paliers pour un créateur connecté
 * Calcule la somme des vues de toutes ses vidéos acceptées sur la campagne
 * @route GET /api/campaigns/:id/my-rewards-status
 * @param {number} id - ID de la campagne
 * @returns {RewardsStatusResponse} État des paliers avec progression
 */
export const getMyRewardsStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as Request & { user?: AuthUser }).user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Non authentifié', code: 'UNAUTHORIZED' });
      return;
    }

    const campaignId = parseInt(req.params.id, 10);

    if (isNaN(campaignId)) {
      res.status(400).json({ error: 'ID de campagne invalide', code: 'INVALID_ID' });
      return;
    }

    // Vérifier que la campagne existe
    const campaign = await db.select().from(campaigns).where(eq(campaigns.id, campaignId)).limit(1);

    if (!campaign[0]) {
      res.status(404).json({ error: 'Campagne non trouvée', code: 'CAMPAIGN_NOT_FOUND' });
      return;
    }

    // Récupérer les comptes TikTok de l'utilisateur
    const userTiktokAccounts = await db
      .select()
      .from(tiktokAccounts)
      .where(eq(tiktokAccounts.userId, userId));

    const accountIds = userTiktokAccounts.map((a) => a.id);

    // Récupérer les paliers de la campagne
    const rewards = await db
      .select()
      .from(campaignRewards)
      .where(eq(campaignRewards.campaignId, campaignId));

    // Si l'utilisateur n'a pas de compte TikTok, retourner les paliers sans progression
    if (accountIds.length === 0) {
      const response: RewardsStatusResponse = rewards.map((r) => ({
        rewardId: r.id,
        viewsTarget: r.viewsTarget,
        amountEur: r.amountEur,
        totalViews: 0,
        isUnlocked: false,
        invoice: null,
        anchorSubmissionId: null,
      }));
      res.json(response);
      return;
    }

    // Récupérer toutes les soumissions acceptées de l'utilisateur sur cette campagne
    const userSubmissions = await db
      .select()
      .from(campaignSubmissions)
      .where(
        and(
          eq(campaignSubmissions.campaignId, campaignId),
          eq(campaignSubmissions.status, 'accepted'),
          inArray(campaignSubmissions.tiktokAccountId, accountIds)
        )
      );

    const submissionIds = userSubmissions.map((s) => s.id);

    // Calculer la somme des vues
    let totalViews = 0;
    if (submissionIds.length > 0) {
      const stats = await db
        .select()
        .from(videoStatsCurrent)
        .where(inArray(videoStatsCurrent.submissionId, submissionIds));

      totalViews = stats.reduce((sum, s) => sum + (s.views || 0), 0);
    }

    // Récupérer les factures existantes pour les soumissions de l'utilisateur
    let userInvoices: Array<{
      id: number;
      submissionId: number;
      rewardId: number;
      status: 'uploaded' | 'paid';
      uploadedAt: Date;
    }> = [];

    if (submissionIds.length > 0) {
      userInvoices = await db
        .select()
        .from(invoices)
        .where(inArray(invoices.submissionId, submissionIds));
    }

    // Créer un map des factures par rewardId
    const invoicesByRewardId = new Map<number, typeof userInvoices[0]>();
    for (const invoice of userInvoices) {
      invoicesByRewardId.set(invoice.rewardId, invoice);
    }

    // Trouver la première soumission acceptée (ancre pour les factures)
    const anchorSubmissionId = userSubmissions.length > 0 
      ? userSubmissions.sort((a, b) => a.id - b.id)[0].id 
      : null;

    // Construire la réponse
    const response: RewardsStatusResponse = rewards.map((r): RewardStatus => {
      const isUnlocked = totalViews >= r.viewsTarget;
      const invoice = invoicesByRewardId.get(r.id);

      return {
        rewardId: r.id,
        viewsTarget: r.viewsTarget,
        amountEur: r.amountEur,
        totalViews,
        isUnlocked,
        invoice: invoice
          ? {
              id: invoice.id,
              status: invoice.status,
              uploadedAt: invoice.uploadedAt.toISOString(),
            }
          : null,
        anchorSubmissionId: isUnlocked ? anchorSubmissionId : null,
      };
    });

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message, code: 'INTERNAL_SERVER_ERROR' });
  }
};







