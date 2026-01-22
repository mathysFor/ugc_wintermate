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
  users,
  tiktokAccounts,
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
        createdAt: campaigns.createdAt,
      })
      .from(campaigns)
      .where(eq(campaigns.brandId, brand.id));

    const campaignIds = brandCampaigns.map((c) => c.id);
    const activeCampaigns = brandCampaigns.filter((c) => c.status === 'active').length;

    // Compter les créateurs sur la plateforme
    const creatorsCountResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(users)
      .where(eq(users.isCreator, true));
    const creatorsCount = Number(creatorsCountResult[0]?.count || 0);

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
        creatorsCount,
        acceptedVideosCount: 0,
        averageCpm: 0,
        acceptedVideosTrend: 0,
        creatorsTrend: 0,
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
        tiktokAccountId: campaignSubmissions.tiktokAccountId,
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
        acceptedVideosCount: 0,
        activeCampaignsCount: 0,
        creatorsCount: 0,
        averageCpm: 0,
        campaignBreakdown: [],
      });
    }

    // Agréger les vues par mois et par campagne, et compter les vidéos acceptées
    const campaignViewsMap = new Map<string, Map<number, number>>();

    for (const submission of submissionsWithStats) {
      const date = new Date(submission.submittedAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const views = submission.views || 0;

      const monthData = monthlyDataMap.get(monthKey);
      if (monthData) {
        monthData.totalViews += views;
        monthData.acceptedVideosCount += 1; // Compter chaque soumission acceptée

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

    // Calculer les campagnes actives par mois (campagnes créées avant ou pendant le mois et toujours actives)
    for (const campaign of brandCampaigns) {
      if (campaign.status === 'active' && campaign.createdAt) {
        const campaignDate = new Date(campaign.createdAt);
        const campaignMonthKey = `${campaignDate.getFullYear()}-${String(campaignDate.getMonth() + 1).padStart(2, '0')}`;
        
        // Pour chaque mois à partir de la création de la campagne jusqu'à maintenant
        for (const [monthKey, monthData] of monthlyDataMap) {
          if (monthKey >= campaignMonthKey) {
            monthData.activeCampaignsCount += 1;
          }
        }
      }
    }

    // Calculer les créateurs uniques par mois (créateurs qui ont soumis des vidéos acceptées)
    // Récupérer tous les tiktokAccounts en une seule requête
    const tiktokAccountIds = submissionsWithStats.map(s => s.tiktokAccountId).filter((id): id is number => id !== null);
    const tiktokAccountsData = tiktokAccountIds.length > 0 
      ? await db
          .select({ id: tiktokAccounts.id, userId: tiktokAccounts.userId })
          .from(tiktokAccounts)
          .where(inArray(tiktokAccounts.id, tiktokAccountIds))
      : [];
    
    const tiktokAccountToUserId = new Map(tiktokAccountsData.map(acc => [acc.id, acc.userId]));
    
    const creatorsByMonth = new Map<string, Set<number>>();
    for (const submission of submissionsWithStats) {
      if (!submission.tiktokAccountId) continue;
      
      const date = new Date(submission.submittedAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      const userId = tiktokAccountToUserId.get(submission.tiktokAccountId);
      if (userId) {
        if (!creatorsByMonth.has(monthKey)) {
          creatorsByMonth.set(monthKey, new Set());
        }
        creatorsByMonth.get(monthKey)!.add(userId);
      }
    }

    // Assigner les créateurs par mois
    for (const [monthKey, creatorSet] of creatorsByMonth) {
      const monthData = monthlyDataMap.get(monthKey);
      if (monthData) {
        monthData.creatorsCount = creatorSet.size;
      }
    }

    // Calculer le CPM moyen par mois (coût pour 1000 vues)
    for (const [monthKey, monthData] of monthlyDataMap) {
      if (monthData.totalViews > 0) {
        // totalCost est en centimes, donc on multiplie par 1000 pour avoir le CPM en centimes
        monthData.averageCpm = Math.round((monthData.totalCost / monthData.totalViews) * 1000);
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

    // Compter les vidéos acceptées pour les campagnes de la marque
    const acceptedVideosCount = submissionsWithStats.length;

    // Calculer le CPM moyen (coût pour 1000 vues) en centimes
    // CPM = (totalSpent / totalViews) * 1000
    // totalSpent est en centimes, donc on multiplie par 1000 pour avoir le coût pour 1000 vues en centimes
    const averageCpm = totalViews > 0 ? Math.round((totalSpent / totalViews) * 1000) : 0;

    // Calculer les tendances (mois actuel vs mois précédent)
    const currentMonth = monthlyData[monthlyData.length - 1];
    const previousMonth = monthlyData[monthlyData.length - 2];

    let viewsTrend = 0;
    let spentTrend = 0;
    let acceptedVideosTrend = 0;

    // Calculer la tendance des vues (même si le mois précédent avait 0 vues)
    if (previousMonth) {
      if (previousMonth.totalViews > 0) {
        viewsTrend = Math.round(
          ((currentMonth.totalViews - previousMonth.totalViews) / previousMonth.totalViews) * 100
        );
      } else if (currentMonth.totalViews > 0) {
        // Si le mois précédent avait 0 vues mais le mois actuel en a, c'est une augmentation de 100%
        viewsTrend = 100;
      }
    }
    
    // Calculer la tendance du budget dépensé (même si le mois précédent avait 0)
    if (previousMonth) {
      if (previousMonth.totalCost > 0) {
        spentTrend = Math.round(
          ((currentMonth.totalCost - previousMonth.totalCost) / previousMonth.totalCost) * 100
        );
      } else if (currentMonth.totalCost > 0) {
        // Si le mois précédent avait 0 dépensé mais le mois actuel en a, c'est une augmentation de 100%
        spentTrend = 100;
      }
    }

    // Calculer la tendance des vidéos acceptées
    // Compter les soumissions acceptées par mois
    const acceptedVideosByMonth = new Map<string, number>();
    for (const submission of submissionsWithStats) {
      const date = new Date(submission.submittedAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      acceptedVideosByMonth.set(
        monthKey,
        (acceptedVideosByMonth.get(monthKey) || 0) + 1
      );
    }

    const currentMonthKey = monthlyData[monthlyData.length - 1]?.month;
    const previousMonthKey = monthlyData[monthlyData.length - 2]?.month;
    const currentMonthAcceptedVideos = acceptedVideosByMonth.get(currentMonthKey || '') || 0;
    const previousMonthAcceptedVideos = acceptedVideosByMonth.get(previousMonthKey || '') || 0;

    // Calculer la tendance des vidéos acceptées (même si le mois précédent avait 0)
    if (previousMonthKey) {
      if (previousMonthAcceptedVideos > 0) {
        acceptedVideosTrend = Math.round(
          ((currentMonthAcceptedVideos - previousMonthAcceptedVideos) / previousMonthAcceptedVideos) * 100
        );
      } else if (currentMonthAcceptedVideos > 0) {
        // Si le mois précédent avait 0 vidéos mais le mois actuel en a, c'est une augmentation de 100%
        acceptedVideosTrend = 100;
      }
    }

    const stats: BrandDashboardStats = {
      monthlyData,
      totalViews,
      totalSpent,
      activeCampaigns,
      averageRoi: Math.round(averageRoi * 100) / 100,
      viewsTrend,
      spentTrend,
      creatorsCount,
      acceptedVideosCount,
      averageCpm,
      acceptedVideosTrend,
      creatorsTrend: 0, // Pas de calcul de tendance pour les créateurs
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

