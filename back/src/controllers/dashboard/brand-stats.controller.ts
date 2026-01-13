import { Request, Response } from 'express';
import { eq, and, sql, gte, inArray } from 'drizzle-orm';
import { db } from '../../db';
import {
  brands,
  campaigns,
  campaignSubmissions,
  videoStatsCurrent,
  invoices,
  campaignRewards,
  referralInvoices,
} from '../../db/schema';
import type {
  BrandDashboardStats,
  BrandMonthlyData,
  CampaignMonthlyViews,
} from '@shared/types/dashboard';
import type { AuthUser } from '@shared/types/auth';

/**
 * Récupère les statistiques du dashboard pour une marque
 * @route GET /api/dashboard/brand/stats
 * @returns {BrandDashboardStatsResponse} Statistiques agrégées du dashboard marque
 */
export const getBrandDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as Request & { user?: AuthUser }).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Non authentifié', code: 'UNAUTHORIZED' });
      return;
    }

    // Récupérer la marque de l'utilisateur
    const [brand] = await db
      .select()
      .from(brands)
      .where(eq(brands.userId, userId))
      .limit(1);

    if (!brand) {
      res.status(404).json({ error: 'Marque non trouvée', code: 'BRAND_NOT_FOUND' });
      return;
    }

    // Récupérer toutes les campagnes de la marque
    const brandCampaigns = await db
      .select({
        id: campaigns.id,
        title: campaigns.title,
        status: campaigns.status,
      })
      .from(campaigns)
      .where(eq(campaigns.brandId, brand.id));

    const campaignIds = brandCampaigns.map((c) => c.id);
    const activeCampaigns = brandCampaigns.filter((c) => c.status === 'active').length;

    if (campaignIds.length === 0) {
      // Pas de campagnes, retourner des stats vides
      const emptyStats: BrandDashboardStats = {
        monthlyData: [],
        totalViews: 0,
        totalSpent: 0,
        activeCampaigns: 0,
        averageRoi: 0,
        viewsTrend: 0,
        spentTrend: 0,
      };
      res.json(emptyStats);
      return;
    }

    // Date il y a 12 mois
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    // Récupérer toutes les soumissions acceptées avec leurs stats
    const submissionsWithStats = await db
      .select({
        submissionId: campaignSubmissions.id,
        campaignId: campaignSubmissions.campaignId,
        submittedAt: campaignSubmissions.submittedAt,
        views: videoStatsCurrent.views,
      })
      .from(campaignSubmissions)
      .leftJoin(videoStatsCurrent, eq(videoStatsCurrent.submissionId, campaignSubmissions.id))
      .where(
        and(
          inArray(campaignSubmissions.campaignId, campaignIds),
          eq(campaignSubmissions.status, 'accepted'),
          gte(campaignSubmissions.submittedAt, twelveMonthsAgo)
        )
      );

    // Récupérer les invoices payées (campagnes)
    const paidInvoices = await db
      .select({
        invoiceId: invoices.id,
        submissionId: invoices.submissionId,
        rewardId: invoices.rewardId,
        paidAt: invoices.paidAt,
        amountEur: campaignRewards.amountEur,
        campaignId: campaignRewards.campaignId,
      })
      .from(invoices)
      .innerJoin(campaignRewards, eq(campaignRewards.id, invoices.rewardId))
      .innerJoin(campaignSubmissions, eq(campaignSubmissions.id, invoices.submissionId))
      .where(
        and(
          inArray(campaignRewards.campaignId, campaignIds),
          eq(invoices.status, 'paid')
        )
      );

    // Récupérer les factures de parrainage payées
    const paidReferralInvoices = await db
      .select({
        id: referralInvoices.id,
        amountEur: referralInvoices.amountEur,
        paidAt: referralInvoices.paidAt,
      })
      .from(referralInvoices)
      .where(eq(referralInvoices.status, 'paid'));

    // Construire les données mensuelles
    const monthlyDataMap = new Map<string, BrandMonthlyData>();
    const campaignMap = new Map(brandCampaigns.map((c) => [c.id, c.title]));

    // Générer les 12 derniers mois
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyDataMap.set(monthKey, {
        month: monthKey,
        totalViews: 0,
        totalCost: 0,
        campaignBreakdown: [],
      });
    }

    // Agréger les vues par mois et par campagne
    const campaignViewsMap = new Map<string, Map<number, number>>();

    for (const submission of submissionsWithStats) {
      const date = new Date(submission.submittedAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const views = submission.views || 0;

      const monthData = monthlyDataMap.get(monthKey);
      if (monthData) {
        monthData.totalViews += views;

        if (!campaignViewsMap.has(monthKey)) {
          campaignViewsMap.set(monthKey, new Map());
        }
        const campaignViews = campaignViewsMap.get(monthKey)!;
        campaignViews.set(
          submission.campaignId,
          (campaignViews.get(submission.campaignId) || 0) + views
        );
      }
    }

    // Agréger les coûts par mois (factures campagnes)
    for (const invoice of paidInvoices) {
      if (invoice.paidAt) {
        const date = new Date(invoice.paidAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthData = monthlyDataMap.get(monthKey);
        if (monthData) {
          monthData.totalCost += invoice.amountEur;
        }
      }
    }

    // Agréger les coûts de parrainage par mois
    for (const refInvoice of paidReferralInvoices) {
      if (refInvoice.paidAt) {
        const date = new Date(refInvoice.paidAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthData = monthlyDataMap.get(monthKey);
        if (monthData) {
          monthData.totalCost += refInvoice.amountEur;
        }
      }
    }

    // Construire le breakdown par campagne pour chaque mois
    for (const [monthKey, campaignViews] of campaignViewsMap) {
      const monthData = monthlyDataMap.get(monthKey);
      if (monthData) {
        const breakdown: CampaignMonthlyViews[] = [];
        for (const [campaignId, views] of campaignViews) {
          breakdown.push({
            campaignId,
            campaignTitle: campaignMap.get(campaignId) || 'Campagne inconnue',
            views,
          });
        }
        monthData.campaignBreakdown = breakdown.sort((a, b) => b.views - a.views);
      }
    }

    // Calculer les totaux
    const monthlyData = Array.from(monthlyDataMap.values());
    const totalViews = monthlyData.reduce((sum, m) => sum + m.totalViews, 0);
    
    // Total dépensé = factures campagnes + factures parrainage
    const campaignSpent = paidInvoices.reduce((sum, i) => sum + i.amountEur, 0);
    const referralSpent = paidReferralInvoices.reduce((sum, i) => sum + i.amountEur, 0);
    const totalSpent = campaignSpent + referralSpent;
    
    const averageRoi = totalSpent > 0 ? totalViews / (totalSpent / 100) : 0;

    // Calculer les tendances (mois actuel vs mois précédent)
    const currentMonth = monthlyData[monthlyData.length - 1];
    const previousMonth = monthlyData[monthlyData.length - 2];

    let viewsTrend = 0;
    let spentTrend = 0;

    if (previousMonth && previousMonth.totalViews > 0) {
      viewsTrend = Math.round(
        ((currentMonth.totalViews - previousMonth.totalViews) / previousMonth.totalViews) * 100
      );
    }
    if (previousMonth && previousMonth.totalCost > 0) {
      spentTrend = Math.round(
        ((currentMonth.totalCost - previousMonth.totalCost) / previousMonth.totalCost) * 100
      );
    }

    const stats: BrandDashboardStats = {
      monthlyData,
      totalViews,
      totalSpent,
      activeCampaigns,
      averageRoi: Math.round(averageRoi * 100) / 100,
      viewsTrend,
      spentTrend,
    };

    res.json(stats);
  } catch (error) {
    console.error('[GetBrandDashboardStats] Erreur:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId: (req as Request & { user?: AuthUser }).user?.id,
    });
    res.status(500).json({ error: (error as Error).message, code: 'INTERNAL_SERVER_ERROR' });
  }
};

