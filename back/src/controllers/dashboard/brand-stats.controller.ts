import { Request, Response } from 'express';
import { eq, and, sql, gte, lte, inArray } from 'drizzle-orm';
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
  DashboardPeriod,
  ChartDataPoint,
} from '@shared/types/dashboard';
import type { AuthUser } from '@shared/types/auth';

/**
 * Calcule la plage de dates en fonction de la période demandée
 */
const getDateRange = (
  period: DashboardPeriod,
  customStartDate?: string,
  customEndDate?: string
): { startDate: Date; endDate: Date; granularity: 'day' | 'month' } => {
  let endDate = new Date();
  endDate.setHours(23, 59, 59, 999);
  let startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  let granularity: 'day' | 'month' = 'day';

  switch (period) {
    case 'today':
      // startDate est déjà aujourd'hui 00:00:00
      break;
    case '7d':
      startDate.setDate(startDate.getDate() - 6);
      break;
    case '14d':
      startDate.setDate(startDate.getDate() - 13);
      break;
    case '30d':
      startDate.setDate(startDate.getDate() - 29);
      break;
    case '12m':
      startDate.setMonth(startDate.getMonth() - 11);
      startDate.setDate(1); // Premier jour du mois
      granularity = 'month';
      break;
    case 'custom':
      if (customStartDate) {
        startDate = new Date(customStartDate);
        startDate.setHours(0, 0, 0, 0);
      }
      if (customEndDate) {
        endDate = new Date(customEndDate);
        endDate.setHours(23, 59, 59, 999);
      }
      // Si la période est supérieure à 2 mois (60 jours), on passe en mensuel
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 60) {
        granularity = 'month';
      }
      break;
    default:
      // Par défaut 12 mois
      startDate.setMonth(startDate.getMonth() - 11);
      startDate.setDate(1);
      granularity = 'month';
  }

  return { startDate, endDate, granularity };
};

/**
 * Formate une date en clé pour le regroupement
 */
const formatDateKey = (date: Date, granularity: 'day' | 'month'): string => {
  if (granularity === 'month') {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

/**
 * Formate une clé de date en libellé lisible
 */
const formatLabel = (key: string, granularity: 'day' | 'month'): string => {
  const date = new Date(key);
  if (granularity === 'month') {
    return date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
  }
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
};

/**
 * Génère toutes les clés de date entre startDate et endDate
 */
const generateDateKeys = (startDate: Date, endDate: Date, granularity: 'day' | 'month'): string[] => {
  const keys: string[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    keys.push(formatDateKey(currentDate, granularity));
    if (granularity === 'month') {
      currentDate.setMonth(currentDate.getMonth() + 1);
    } else {
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }
  return keys;
};

/**
 * Récupère les statistiques du dashboard pour une marque
 * @route GET /api/dashboard/brand/stats
 * @returns {BrandDashboardStatsResponse} Statistiques agrégées du dashboard marque
 */
export const getBrandDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as Request & { user?: AuthUser }).user?.id;
    // #region agent log
    fetch('http://127.0.0.1:7247/ingest/33cc8e5c-f359-45c2-9a3c-80250deab640',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'brand-stats.controller.ts:29',message:'getBrandDashboardStats called',data:{userId,userEmail:(req as Request & { user?: AuthUser }).user?.email},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    if (!userId) {
      res.status(401).json({ error: 'Non authentifié', code: 'UNAUTHORIZED' });
      return;
    }

    // Paramètres de filtrage
    const period = (req.query.period as DashboardPeriod) || '12m';
    const customStartDate = req.query.startDate as string;
    const customEndDate = req.query.endDate as string;

    const { startDate, endDate, granularity } = getDateRange(period, customStartDate, customEndDate);

    // Récupérer la marque de l'utilisateur
    const [brand] = await db
      .select()
      .from(brands)
      .where(eq(brands.userId, userId))
      .limit(1);

    // #region agent log
    fetch('http://127.0.0.1:7247/ingest/33cc8e5c-f359-45c2-9a3c-80250deab640',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'brand-stats.controller.ts:40',message:'Brand retrieved',data:{userId,brandId:brand?.id,brandName:brand?.name,brandUserId:brand?.userId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

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
    
    // #region agent log
    fetch('http://127.0.0.1:7247/ingest/33cc8e5c-f359-45c2-9a3c-80250deab640',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'brand-stats.controller.ts:58',message:'Campaigns retrieved',data:{userId,brandId:brand.id,campaignIds,campaignTitles:brandCampaigns.map(c=>c.title)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    // Compter les créateurs sur la plateforme
    const creatorsCountResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(users)
      .where(eq(users.isCreator, true));
    const creatorsCount = Number(creatorsCountResult[0]?.count || 0);

    // Récupérer tous les créateurs avec leur date de création pour la courbe de croissance
    const allCreators = await db
      .select({ createdAt: users.createdAt })
      .from(users)
      .where(eq(users.isCreator, true))
      .orderBy(users.createdAt);

    console.log('[BrandStats] Request:', { period, startDate, endDate, granularity });
    
    if (campaignIds.length === 0) {
      // Pas de campagnes, retourner des stats vides
      // Calculer quand même la courbe des créateurs plateforme
      const chartDataMap = new Map<string, ChartDataPoint>();
      
      const emptyStats: BrandDashboardStats = {
        monthlyData: [],
        chartData: [],
        totalViews: 0,
        totalSpent: 0,
        activeCampaigns: 0,
        averageRoi: 0,
        viewsTrend: 0,
        spentTrend: 0,
        creatorsCount,
        activeCreatorsCount: 0,
        platformCreatorsTrend: 0,
        acceptedVideosCount: 0,
        averageCpm: 0,
        acceptedVideosTrend: 0,
        creatorsTrend: 0,
      };
      res.json(emptyStats);
      return;
    }

    // Récupérer toutes les soumissions acceptées avec leurs stats dans la période
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
          gte(campaignSubmissions.submittedAt, startDate),
          lte(campaignSubmissions.submittedAt, endDate)
        )
      );

    // Récupérer les invoices payées (campagnes) dans la période
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
          eq(invoices.status, 'paid'),
          gte(invoices.paidAt, startDate),
          lte(invoices.paidAt, endDate)
        )
      );

    // Récupérer les factures de parrainage payées dans la période
    const paidReferralInvoices = await db
      .select({
        id: referralInvoices.id,
        amountEur: referralInvoices.amountEur,
        paidAt: referralInvoices.paidAt,
      })
      .from(referralInvoices)
      .where(
        and(
          eq(referralInvoices.status, 'paid'),
          gte(referralInvoices.paidAt, startDate),
          lte(referralInvoices.paidAt, endDate)
        )
      );

    // Initialiser les données du graphique
    const chartDataMap = new Map<string, ChartDataPoint>();
    const dateKeys = generateDateKeys(startDate, endDate, granularity);
    const campaignMap = new Map(brandCampaigns.map((c) => [c.id, c.title]));

    for (const key of dateKeys) {
      // Trouver la date de fin de cette période (jour ou mois) pour le cumul des créateurs plateforme
      let periodEndDate = new Date(key);
      if (granularity === 'month') {
        periodEndDate = new Date(periodEndDate.getFullYear(), periodEndDate.getMonth() + 1, 0, 23, 59, 59, 999);
      } else {
        periodEndDate.setHours(23, 59, 59, 999);
      }

      // Compter les créateurs inscrits jusqu'à cette date
      const platformCreatorsCount = allCreators.filter(c => c.createdAt && new Date(c.createdAt) <= periodEndDate).length;

      chartDataMap.set(key, {
        date: key,
        label: formatLabel(key, granularity),
        totalViews: 0,
        totalCost: 0,
        acceptedVideosCount: 0,
        activeCampaignsCount: 0,
        creatorsCount: 0,
        platformCreatorsCount,
        averageCpm: 0,
        campaignBreakdown: [],
      });
    }

    // Agréger les vues par période et par campagne
    const campaignViewsMap = new Map<string, Map<number, number>>();

    for (const submission of submissionsWithStats) {
      const date = new Date(submission.submittedAt);
      const key = formatDateKey(date, granularity);
      const views = submission.views || 0;

      const dataPoint = chartDataMap.get(key);
      if (dataPoint) {
        dataPoint.totalViews += views;
        dataPoint.acceptedVideosCount += 1;

        if (!campaignViewsMap.has(key)) {
          campaignViewsMap.set(key, new Map());
        }
        const campaignViews = campaignViewsMap.get(key)!;
        campaignViews.set(
          submission.campaignId,
          (campaignViews.get(submission.campaignId) || 0) + views
        );
      }
    }

    // Agréger les coûts par période (factures campagnes)
    for (const invoice of paidInvoices) {
      if (invoice.paidAt) {
        const date = new Date(invoice.paidAt);
        const key = formatDateKey(date, granularity);
        const dataPoint = chartDataMap.get(key);
        if (dataPoint) {
          dataPoint.totalCost += invoice.amountEur;
        }
      }
    }

    // Agréger les coûts de parrainage par période
    for (const refInvoice of paidReferralInvoices) {
      if (refInvoice.paidAt) {
        const date = new Date(refInvoice.paidAt);
        const key = formatDateKey(date, granularity);
        const dataPoint = chartDataMap.get(key);
        if (dataPoint) {
          dataPoint.totalCost += refInvoice.amountEur;
        }
      }
    }

    // Construire le breakdown par campagne pour chaque période
    for (const [key, campaignViews] of campaignViewsMap) {
      const dataPoint = chartDataMap.get(key);
      if (dataPoint) {
        const breakdown: CampaignMonthlyViews[] = [];
        for (const [campaignId, views] of campaignViews) {
          breakdown.push({
            campaignId,
            campaignTitle: campaignMap.get(campaignId) || 'Campagne inconnue',
            views,
          });
        }
        dataPoint.campaignBreakdown = breakdown.sort((a, b) => b.views - a.views);
      }
    }

    // Calculer les campagnes actives par période
    for (const campaign of brandCampaigns) {
      if (campaign.status === 'active' && campaign.createdAt) {
        const campaignDate = new Date(campaign.createdAt);
        const campaignKey = formatDateKey(campaignDate, granularity);
        
        for (const [key, dataPoint] of chartDataMap) {
          if (key >= campaignKey) {
            dataPoint.activeCampaignsCount += 1;
          }
        }
      }
    }

    // Calculer les créateurs uniques par période
    const tiktokAccountIds = submissionsWithStats.map(s => s.tiktokAccountId).filter((id): id is number => id !== null);
    const tiktokAccountsData = tiktokAccountIds.length > 0 
      ? await db
          .select({ id: tiktokAccounts.id, userId: tiktokAccounts.userId })
          .from(tiktokAccounts)
          .where(inArray(tiktokAccounts.id, tiktokAccountIds))
      : [];
    
    const tiktokAccountToUserId = new Map(tiktokAccountsData.map(acc => [acc.id, acc.userId]));
    
    const creatorsByPeriod = new Map<string, Set<number>>();
    for (const submission of submissionsWithStats) {
      if (!submission.tiktokAccountId) continue;
      
      const date = new Date(submission.submittedAt);
      const key = formatDateKey(date, granularity);
      
      const userId = tiktokAccountToUserId.get(submission.tiktokAccountId);
      if (userId) {
        if (!creatorsByPeriod.has(key)) {
          creatorsByPeriod.set(key, new Set());
        }
        creatorsByPeriod.get(key)!.add(userId);
      }
    }

    for (const [key, creatorSet] of creatorsByPeriod) {
      const dataPoint = chartDataMap.get(key);
      if (dataPoint) {
        dataPoint.creatorsCount = creatorSet.size;
      }
    }

    // Calculer le CPM moyen par période
    for (const [_, dataPoint] of chartDataMap) {
      if (dataPoint.totalViews > 0) {
        dataPoint.averageCpm = Math.round((dataPoint.totalCost / dataPoint.totalViews) * 1000);
      }
    }

    const chartData = Array.from(chartDataMap.values());

    // Calculer les totaux sur la période sélectionnée
    const totalViews = chartData.reduce((sum, d) => sum + d.totalViews, 0);
    const totalSpent = chartData.reduce((sum, d) => sum + d.totalCost, 0);
    const averageRoi = totalSpent > 0 ? totalViews / (totalSpent / 100) : 0;
    const acceptedVideosCount = submissionsWithStats.length;
    const averageCpm = totalViews > 0 ? Math.round((totalSpent / totalViews) * 1000) : 0;

    // --- Calcul des tendances (comparaison avec la période précédente) ---
    
    // Calculer la durée de la période actuelle en millisecondes
    const periodDuration = endDate.getTime() - startDate.getTime();
    
    // Définir la période précédente
    const previousEndDate = new Date(startDate.getTime() - 1); // Juste avant startDate
    const previousStartDate = new Date(previousEndDate.getTime() - periodDuration);

    // Récupérer les stats de la période précédente pour les tendances
    // Vues précédentes
    const previousSubmissions = await db
      .select({
        views: videoStatsCurrent.views,
        submittedAt: campaignSubmissions.submittedAt,
      })
      .from(campaignSubmissions)
      .leftJoin(videoStatsCurrent, eq(videoStatsCurrent.submissionId, campaignSubmissions.id))
      .where(
        and(
          inArray(campaignSubmissions.campaignId, campaignIds),
          eq(campaignSubmissions.status, 'accepted'),
          gte(campaignSubmissions.submittedAt, previousStartDate),
          lte(campaignSubmissions.submittedAt, previousEndDate)
        )
      );

    const previousTotalViews = previousSubmissions.reduce((sum, s) => sum + (s.views || 0), 0);
    const previousAcceptedVideosCount = previousSubmissions.length;

    // Coûts précédents
    const previousPaidInvoices = await db
      .select({ amountEur: campaignRewards.amountEur })
      .from(invoices)
      .innerJoin(campaignRewards, eq(campaignRewards.id, invoices.rewardId))
      .where(
        and(
          inArray(campaignRewards.campaignId, campaignIds),
          eq(invoices.status, 'paid'),
          gte(invoices.paidAt, previousStartDate),
          lte(invoices.paidAt, previousEndDate)
        )
      );
      
    const previousPaidReferralInvoices = await db
      .select({ amountEur: referralInvoices.amountEur })
      .from(referralInvoices)
      .where(
        and(
          eq(referralInvoices.status, 'paid'),
          gte(referralInvoices.paidAt, previousStartDate),
          lte(referralInvoices.paidAt, previousEndDate)
        )
      );

    const previousTotalSpent = 
      previousPaidInvoices.reduce((sum, i) => sum + i.amountEur, 0) +
      previousPaidReferralInvoices.reduce((sum, i) => sum + i.amountEur, 0);

    // Calcul des pourcentages d'évolution
    let viewsTrend = 0;
    if (previousTotalViews > 0) {
      viewsTrend = Math.round(((totalViews - previousTotalViews) / previousTotalViews) * 100);
    } else if (totalViews > 0) {
      viewsTrend = 100;
    }

    let spentTrend = 0;
    if (previousTotalSpent > 0) {
      spentTrend = Math.round(((totalSpent - previousTotalSpent) / previousTotalSpent) * 100);
    } else if (totalSpent > 0) {
      spentTrend = 100;
    }

    let acceptedVideosTrend = 0;
    if (previousAcceptedVideosCount > 0) {
      acceptedVideosTrend = Math.round(((acceptedVideosCount - previousAcceptedVideosCount) / previousAcceptedVideosCount) * 100);
    } else if (acceptedVideosCount > 0) {
      acceptedVideosTrend = 100;
    }

    // Calcul de la tendance des créateurs (nouveaux inscrits sur la période vs période précédente)
    const newCreatorsInPeriod = allCreators.filter(c => 
      c.createdAt && new Date(c.createdAt) >= startDate && new Date(c.createdAt) <= endDate
    ).length;

    const newCreatorsInPreviousPeriod = allCreators.filter(c => 
      c.createdAt && new Date(c.createdAt) >= previousStartDate && new Date(c.createdAt) <= previousEndDate
    ).length;

    let platformCreatorsTrend = 0;
    if (newCreatorsInPreviousPeriod > 0) {
      platformCreatorsTrend = Math.round(((newCreatorsInPeriod - newCreatorsInPreviousPeriod) / newCreatorsInPreviousPeriod) * 100);
    } else if (newCreatorsInPeriod > 0) {
      platformCreatorsTrend = 100;
    }

    // Pour la rétrocompatibilité, on remplit monthlyData si la granularité est 'month'
    // Sinon on laisse vide ou on adapte (ici on laisse vide si c'est pas 'month' pour simplifier, 
    // le front utilisera chartData de toute façon)
    let monthlyData: BrandMonthlyData[] = [];
    if (granularity === 'month') {
      monthlyData = chartData.map(d => ({
        month: d.date,
        totalViews: d.totalViews,
        totalCost: d.totalCost,
        acceptedVideosCount: d.acceptedVideosCount,
        activeCampaignsCount: d.activeCampaignsCount,
        creatorsCount: d.creatorsCount,
        averageCpm: d.averageCpm,
        campaignBreakdown: d.campaignBreakdown
      }));
    }
    // Calculer le nombre total de créateurs actifs sur la période
    const activeCreatorsSet = new Set<number>();
    for (const submission of submissionsWithStats) {
      if (submission.tiktokAccountId) {
        const userId = tiktokAccountToUserId.get(submission.tiktokAccountId);
        if (userId) {
          activeCreatorsSet.add(userId);
        }
      }
    }
    const activeCreatorsCount = activeCreatorsSet.size;

    const stats: BrandDashboardStats = {
      monthlyData, // Rempli seulement si granularité mois, sinon vide (mais chartData est là)
      chartData,
      totalViews,
      totalSpent,
      activeCampaigns,
      averageRoi: Math.round(averageRoi * 100) / 100,
      viewsTrend,
      spentTrend,
      creatorsCount,
      activeCreatorsCount,
      platformCreatorsTrend,
      acceptedVideosCount,
      averageCpm,
      acceptedVideosTrend,
      creatorsTrend: 0, // Pas de calcul de tendance pour les créateurs actifs
    };

    // #region agent log
    fetch('http://127.0.0.1:7247/ingest/33cc8e5c-f359-45c2-9a3c-80250deab640',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'brand-stats.controller.ts:378',message:'Stats returned',data:{userId,brandId:brand.id,brandName:brand.name,totalViews,acceptedVideosCount,firstMonthCampaigns:monthlyData[0]?.campaignBreakdown?.map(cb=>cb.campaignTitle)||[]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion

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
