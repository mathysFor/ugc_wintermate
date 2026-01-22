import { Request, Response } from 'express';
import { eq, and, sql, inArray } from 'drizzle-orm';
import { db } from '../../db';
import {
  users,
  tiktokAccounts,
  campaignSubmissions,
  videoStatsCurrent,
  invoices,
  campaignRewards,
  referralInvoices,
} from '../../db/schema';
import type { CreatorsStatsResponse } from '@shared/types/creators';
import type { AuthUser } from '@shared/types/auth';

/**
 * Récupère les statistiques globales des créateurs
 * @route GET /api/creators/stats
 * @returns {CreatorsStatsResponse} Statistiques agrégées de tous les créateurs
 */
export const getCreatorsStats = async (req: Request, res: Response): Promise<void> => {
  // #region agent log
  fetch('http://127.0.0.1:7245/ingest/0c586d17-ebe2-41ba-8e31-f4aeee668c22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'get-creators-stats.controller.ts:26',message:'getCreatorsStats called',data:{method:req.method,path:req.path,url:req.url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  try {
    const userId = (req as Request & { user?: AuthUser }).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Non authentifié', code: 'UNAUTHORIZED' });
      return;
    }

    // Vérifier que l'utilisateur est une marque
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user?.isBrand) {
      res.status(403).json({ error: 'Accès réservé aux marques', code: 'NOT_A_BRAND' });
      return;
    }

    // Récupérer tous les créateurs
    const allCreators = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.isCreator, true));

    const creatorIds = allCreators.map((c) => c.id);
    const creatorsCount = creatorIds.length;

    if (creatorsCount === 0) {
      const emptyStats: CreatorsStatsResponse = {
        totalViews: 0,
        totalPaid: 0,
        creatorsCount: 0,
        averageViewsPerCreator: 0,
      };
      res.json(emptyStats);
      return;
    }

    // Récupérer tous les comptes TikTok des créateurs
    const allTiktokAccounts = await db
      .select({ id: tiktokAccounts.id, userId: tiktokAccounts.userId })
      .from(tiktokAccounts)
      .where(inArray(tiktokAccounts.userId, creatorIds));

    const tiktokAccountIds = allTiktokAccounts.map((a) => a.id);

    // Calculer les vues totales (somme des vues de toutes les soumissions acceptées)
    let totalViews = 0;
    if (tiktokAccountIds.length > 0) {
      const viewsResult = await db
        .select({
          totalViews: sql<number>`COALESCE(SUM(${videoStatsCurrent.views}), 0)`,
        })
        .from(campaignSubmissions)
        .innerJoin(videoStatsCurrent, eq(videoStatsCurrent.submissionId, campaignSubmissions.id))
        .where(
          and(
            inArray(campaignSubmissions.tiktokAccountId, tiktokAccountIds),
            eq(campaignSubmissions.status, 'accepted')
          )
        );

      totalViews = Number(viewsResult[0]?.totalViews || 0);
    }

    // Calculer le total payé (factures campagnes + factures parrainage)
    let totalPaid = 0;

    // Factures campagnes payées
    if (tiktokAccountIds.length > 0) {
      const campaignInvoicesResult = await db
        .select({
          totalPaid: sql<number>`COALESCE(SUM(${campaignRewards.amountEur}), 0)`,
        })
        .from(invoices)
        .innerJoin(campaignRewards, eq(campaignRewards.id, invoices.rewardId))
        .innerJoin(campaignSubmissions, eq(campaignSubmissions.id, invoices.submissionId))
        .where(
          and(
            inArray(campaignSubmissions.tiktokAccountId, tiktokAccountIds),
            eq(invoices.status, 'paid')
          )
        );

      totalPaid += Number(campaignInvoicesResult[0]?.totalPaid || 0);
    }

    // Factures parrainage payées (pour tous les créateurs)
    if (creatorIds.length > 0) {
      const referralInvoicesResult = await db
        .select({
          totalPaid: sql<number>`COALESCE(SUM(${referralInvoices.amountEur}), 0)`,
        })
        .from(referralInvoices)
        .where(
          and(
            inArray(referralInvoices.userId, creatorIds),
            eq(referralInvoices.status, 'paid')
          )
        );

      totalPaid += Number(referralInvoicesResult[0]?.totalPaid || 0);
    }

    // Calculer la moyenne vues/créateur
    const averageViewsPerCreator = creatorsCount > 0 ? Math.round(totalViews / creatorsCount) : 0;

    const stats: CreatorsStatsResponse = {
      totalViews,
      totalPaid,
      creatorsCount,
      averageViewsPerCreator,
    };

    res.json(stats);
  } catch (error) {
    console.error('[GetCreatorsStats] Erreur:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId: (req as Request & { user?: AuthUser }).user?.id,
    });
    res.status(500).json({ error: (error as Error).message, code: 'INTERNAL_SERVER_ERROR' });
  }
};

