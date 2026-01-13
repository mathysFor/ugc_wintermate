import { Request, Response } from 'express';
import { eq, and, gte, desc, inArray } from 'drizzle-orm';
import { db } from '../../db';
import {
  tiktokAccounts,
  campaignSubmissions,
  videoStatsCurrent,
  invoices,
  campaignRewards,
  campaigns,
  referralCommissions,
  referralInvoices,
} from '../../db/schema';
import type {
  CreatorDashboardStats,
  CreatorMonthlyData,
  TopVideo,
} from '@shared/types/dashboard';
import type { AuthUser } from '@shared/types/auth';

/**
 * Récupère les statistiques du dashboard pour un créateur
 * @route GET /api/dashboard/creator/stats
 * @returns {CreatorDashboardStatsResponse} Statistiques agrégées du dashboard créateur
 */
export const getCreatorDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as Request & { user?: AuthUser }).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Non authentifié', code: 'UNAUTHORIZED' });
      return;
    }

    // Récupérer les comptes TikTok du créateur
    const accounts = await db
      .select({ id: tiktokAccounts.id })
      .from(tiktokAccounts)
      .where(eq(tiktokAccounts.userId, userId));

    const accountIds = accounts.map((a) => a.id);

    if (accountIds.length === 0) {
      // Pas de compte TikTok, retourner des stats vides
      const emptyStats: CreatorDashboardStats = {
        totalSubmissions: 0,
        acceptedSubmissions: 0,
        pendingSubmissions: 0,
        refusedSubmissions: 0,
        totalEarnings: 0,
        pendingEarnings: 0,
        totalInvoices: 0,
        paidInvoices: 0,
        pendingInvoices: 0,
        connectedAccounts: 0,
        totalViews: 0,
        monthlyData: [],
        viewsTrend: 0,
        earningsTrend: 0,
        topVideosByViews: [],
        topVideosByEarnings: [],
        submissionsByMonth: [],
        earningsByMonth: [],
        recentSubmissions: [],
        recentVideos: [],
        connectedTiktokAccounts: [],
      };
      res.json(emptyStats);
      return;
    }

    // Date il y a 12 mois
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    // Date du début du mois actuel
    const startOfCurrentMonth = new Date();
    startOfCurrentMonth.setDate(1);
    startOfCurrentMonth.setHours(0, 0, 0, 0);

    // Récupérer toutes les soumissions avec leurs stats et infos campagne
    const submissionsWithStats = await db
      .select({
        submissionId: campaignSubmissions.id,
        tiktokVideoId: campaignSubmissions.tiktokVideoId,
        campaignId: campaignSubmissions.campaignId,
        campaignTitle: campaigns.title,
        submittedAt: campaignSubmissions.submittedAt,
        status: campaignSubmissions.status,
        views: videoStatsCurrent.views,
        likes: videoStatsCurrent.likes,
        comments: videoStatsCurrent.comments,
        shares: videoStatsCurrent.shares,
      })
      .from(campaignSubmissions)
      .innerJoin(campaigns, eq(campaigns.id, campaignSubmissions.campaignId))
      .leftJoin(videoStatsCurrent, eq(videoStatsCurrent.submissionId, campaignSubmissions.id))
      .where(
        and(
          inArray(campaignSubmissions.tiktokAccountId, accountIds),
          gte(campaignSubmissions.submittedAt, twelveMonthsAgo)
        )
      );

    // Récupérer toutes les invoices avec leurs montants
    const allInvoices = await db
      .select({
        invoiceId: invoices.id,
        submissionId: invoices.submissionId,
        status: invoices.status,
        uploadedAt: invoices.uploadedAt,
        paidAt: invoices.paidAt,
        amountEur: campaignRewards.amountEur,
      })
      .from(invoices)
      .innerJoin(campaignRewards, eq(campaignRewards.id, invoices.rewardId))
      .innerJoin(campaignSubmissions, eq(campaignSubmissions.id, invoices.submissionId))
      .where(inArray(campaignSubmissions.tiktokAccountId, accountIds));

    // Récupérer les commissions de parrainage de l'utilisateur
    const allReferralCommissions = await db
      .select({
        id: referralCommissions.id,
        amountEur: referralCommissions.amountEur,
        status: referralCommissions.status,
        createdAt: referralCommissions.createdAt,
      })
      .from(referralCommissions)
      .where(eq(referralCommissions.referrerId, userId));

    // Récupérer les factures de parrainage de l'utilisateur
    const allReferralInvoices = await db
      .select({
        id: referralInvoices.id,
        amountEur: referralInvoices.amountEur,
        status: referralInvoices.status,
        uploadedAt: referralInvoices.uploadedAt,
        paidAt: referralInvoices.paidAt,
      })
      .from(referralInvoices)
      .where(eq(referralInvoices.userId, userId));

    // Mapper les invoices par submission pour les top vidéos
    const invoiceBySubmission = new Map<number, { amount: number; status: string }>();
    for (const invoice of allInvoices) {
      const existing = invoiceBySubmission.get(invoice.submissionId);
      if (!existing || invoice.amountEur > existing.amount) {
        invoiceBySubmission.set(invoice.submissionId, {
          amount: invoice.amountEur,
          status: invoice.status,
        });
      }
    }

    // Construire les données mensuelles
    const monthlyDataMap = new Map<string, { month: string; submissions: number; earnings: number }>();

    // Générer les 12 derniers mois
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyDataMap.set(monthKey, {
        month: monthKey,
        submissions: 0,
        earnings: 0,
      });
    }

    // Agréger les soumissions par mois
    const submissionsByMonthMap = new Map<string, number>();
    for (const submission of submissionsWithStats) {
      const date = new Date(submission.submittedAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      submissionsByMonthMap.set(monthKey, (submissionsByMonthMap.get(monthKey) || 0) + 1);
      
      const monthData = monthlyDataMap.get(monthKey);
      if (monthData) {
        monthData.submissions += 1;
      }
    }

    // Agréger les gains par mois (factures campagnes)
    const earningsByMonthMap = new Map<string, number>();
    for (const invoice of allInvoices) {
      if (invoice.status === 'paid' && invoice.paidAt) {
        const date = new Date(invoice.paidAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthData = monthlyDataMap.get(monthKey);
        if (monthData) {
          monthData.earnings += invoice.amountEur;
        }
        earningsByMonthMap.set(monthKey, (earningsByMonthMap.get(monthKey) || 0) + invoice.amountEur);
      } else if (invoice.status === 'uploaded') {
        const date = new Date(invoice.uploadedAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthData = monthlyDataMap.get(monthKey);
        if (monthData) {
          monthData.earnings += invoice.amountEur; // Inclure les earnings en attente
        }
      }
    }

    // Agréger les gains de parrainage par mois (factures de parrainage)
    for (const refInvoice of allReferralInvoices) {
      if (refInvoice.status === 'paid' && refInvoice.paidAt) {
        const date = new Date(refInvoice.paidAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthData = monthlyDataMap.get(monthKey);
        if (monthData) {
          monthData.earnings += refInvoice.amountEur;
        }
        earningsByMonthMap.set(monthKey, (earningsByMonthMap.get(monthKey) || 0) + refInvoice.amountEur);
      } else if (refInvoice.status === 'uploaded') {
        const date = new Date(refInvoice.uploadedAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthData = monthlyDataMap.get(monthKey);
        if (monthData) {
          monthData.earnings += refInvoice.amountEur; // Inclure les earnings en attente
        }
      }
    }

    // Calculer les totaux
    const monthlyData = Array.from(monthlyDataMap.values());
    const totalViews = submissionsWithStats
      .filter((s) => s.status === 'accepted')
      .reduce((sum, s) => sum + (s.views || 0), 0);

    // Gains campagnes
    const campaignEarningsPaid = allInvoices
      .filter((i) => i.status === 'paid')
      .reduce((sum, i) => sum + i.amountEur, 0);
    const campaignEarningsPending = allInvoices
      .filter((i) => i.status === 'uploaded')
      .reduce((sum, i) => sum + i.amountEur, 0);

    // Gains parrainage (factures payées)
    const referralEarningsPaid = allReferralInvoices
      .filter((i) => i.status === 'paid')
      .reduce((sum, i) => sum + i.amountEur, 0);

    // Gains parrainage en attente (factures uploadées non payées)
    const referralEarningsPending = allReferralInvoices
      .filter((i) => i.status === 'uploaded')
      .reduce((sum, i) => sum + i.amountEur, 0);

    // Totaux combinés
    const totalEarnings = campaignEarningsPaid + referralEarningsPaid;
    const pendingEarnings = campaignEarningsPending + referralEarningsPending;
    const totalSubmissions = submissionsWithStats.length;

    // Calculer les tendances (mois actuel vs mois précédent)
    const currentMonth = monthlyData[monthlyData.length - 1];
    const previousMonth = monthlyData[monthlyData.length - 2];

    let viewsTrend = 0;
    let earningsTrend = 0;

    // Calculer les vues totales par mois pour la tendance
    const viewsByMonth = new Map<string, number>();
    for (const submission of submissionsWithStats) {
      if (submission.status === 'accepted') {
        const date = new Date(submission.submittedAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        viewsByMonth.set(monthKey, (viewsByMonth.get(monthKey) || 0) + (submission.views || 0));
      }
    }

    const currentMonthViews = viewsByMonth.get(currentMonth?.month || '') || 0;
    const previousMonthViews = viewsByMonth.get(previousMonth?.month || '') || 0;

    if (previousMonth && previousMonthViews > 0) {
      viewsTrend = Math.round(
        ((currentMonthViews - previousMonthViews) / previousMonthViews) * 100
      );
    }
    if (previousMonth && previousMonth.earnings > 0) {
      earningsTrend = Math.round(
        ((currentMonth.earnings - previousMonth.earnings) / previousMonth.earnings) *
          100
      );
    }

    // Top vidéos du mois actuel (par vues) - Nécessite plus d'infos depuis la DB
    const currentMonthSubmissions = submissionsWithStats.filter((s) => {
      const date = new Date(s.submittedAt);
      return date >= startOfCurrentMonth && s.status === 'accepted';
    });

    // Pour les top vidéos, on a besoin de récupérer plus d'infos
    const topVideosByViews: TopVideo[] = [];
    const topVideosByEarnings: TopVideo[] = [];

    // Calculer les stats de soumissions
    const acceptedSubmissions = submissionsWithStats.filter(s => s.status === 'accepted').length;
    const pendingSubmissions = submissionsWithStats.filter(s => s.status === 'pending').length;
    const refusedSubmissions = submissionsWithStats.filter(s => s.status === 'refused').length;
    
    // Calculer les stats de factures
    const paidInvoices = allInvoices.filter(i => i.status === 'paid').length;
    const pendingInvoices = allInvoices.filter(i => i.status === 'uploaded').length;

    // Récupérer les comptes TikTok connectés
    const connectedAccounts = await db
      .select({ id: tiktokAccounts.id, username: tiktokAccounts.username, isValid: tiktokAccounts.isValid })
      .from(tiktokAccounts)
      .where(eq(tiktokAccounts.userId, userId));

    const stats: CreatorDashboardStats = {
      totalSubmissions,
      acceptedSubmissions,
      pendingSubmissions,
      refusedSubmissions,
      totalEarnings,
      pendingEarnings,
      totalInvoices: allInvoices.length,
      paidInvoices,
      pendingInvoices,
      connectedAccounts: connectedAccounts.length,
      totalViews,
      monthlyData,
      viewsTrend,
      earningsTrend,
      topVideosByViews,
      topVideosByEarnings: topVideosByEarnings.map(v => ({
        ...v,
        earnings: v.earnings ?? 0,
      })),
      submissionsByMonth: Array.from(submissionsByMonthMap.entries()).map(([month, count]) => ({ month, count })),
      earningsByMonth: Array.from(earningsByMonthMap.entries()).map(([month, amount]) => ({ month, amount })),
      recentSubmissions: submissionsWithStats
        .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime())
        .slice(0, 5)
        .map(s => ({
          id: s.submissionId,
          campaignTitle: s.campaignTitle,
          status: s.status,
          views: s.views || 0,
          submittedAt: s.submittedAt.toISOString(),
        })),
      recentVideos: [], // Nécessite plus d'infos depuis l'API TikTok
      connectedTiktokAccounts: connectedAccounts.map(acc => ({
        id: acc.id,
        username: acc.username,
        isValid: acc.isValid,
      })),
    };

    res.json(stats);
  } catch (error) {
    console.error('[GetCreatorDashboardStats] Erreur:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId: (req as Request & { user?: AuthUser }).user?.id,
    });
    res.status(500).json({ error: (error as Error).message, code: 'INTERNAL_SERVER_ERROR' });
  }
};

