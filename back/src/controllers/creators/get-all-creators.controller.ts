import { Request, Response } from 'express';
import { eq, gt, lt, asc, desc, and, inArray, sql, count } from 'drizzle-orm';
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
import type { CreatorsListResponse, CreatorListItem } from '@shared/types/creators';
import type { AuthUser } from '@shared/types/auth';

/**
 * Récupère tous les créateurs avec leurs statistiques agrégées
 * @route GET /api/creators
 * @param {string} cursor - Cursor pour la pagination
 * @param {number} limit - Nombre d'éléments par page (max 100)
 * @param {string} direction - Direction de pagination ('next' | 'prev')
 * @param {string} sortBy - Tri par ('views' | 'paid' | 'videos' | 'createdAt')
 * @param {string} search - Recherche par nom ou username
 * @returns {CreatorsListResponse} Liste paginée des créateurs avec leurs stats
 */
export const getAllCreators = async (req: Request, res: Response): Promise<void> => {
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

    const { cursor, limit = '10', direction = 'next', sortBy = 'views', search } = req.query;
    const limitNum = Math.min(Math.max(parseInt(limit as string, 10) || 10, 1), 100);

    // Récupérer tous les créateurs
    let allCreators = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.isCreator, true));

    // Filtre de recherche (par nom ou username TikTok)
    if (search) {
      const searchTerm = `%${search as string}%`;
      // Récupérer les IDs des créateurs dont le username TikTok correspond
      const matchingTiktokAccounts = await db
        .select({ userId: tiktokAccounts.userId })
        .from(tiktokAccounts)
        .where(sql`${tiktokAccounts.username} ILIKE ${searchTerm}`);
      
      const matchingUserIds = new Set(matchingTiktokAccounts.map((a) => a.userId));
      
      // Filtrer les créateurs par nom ou username
      allCreators = allCreators.filter(
        (creator) =>
          creator.firstName.toLowerCase().includes((search as string).toLowerCase()) ||
          creator.lastName.toLowerCase().includes((search as string).toLowerCase()) ||
          matchingUserIds.has(creator.id)
      );
    }

    if (allCreators.length === 0) {
      res.json({ items: [], nextCursor: null, hasMore: false });
      return;
    }

    const creatorIds = allCreators.map((c) => c.id);

    // Récupérer tous les comptes TikTok des créateurs
    const allTiktokAccounts = await db
      .select({
        id: tiktokAccounts.id,
        userId: tiktokAccounts.userId,
        username: tiktokAccounts.username,
      })
      .from(tiktokAccounts)
      .where(inArray(tiktokAccounts.userId, creatorIds));

    // Créer un map userId -> tiktokAccounts
    const tiktokAccountsByUserId = new Map<number, Array<{ id: number; username: string }>>();
    for (const account of allTiktokAccounts) {
      if (!tiktokAccountsByUserId.has(account.userId)) {
        tiktokAccountsByUserId.set(account.userId, []);
      }
      tiktokAccountsByUserId.get(account.userId)!.push({ id: account.id, username: account.username });
    }

    // Créer un map tiktokAccountId -> userId
    const userIdByTiktokAccountId = new Map<number, number>();
    for (const account of allTiktokAccounts) {
      userIdByTiktokAccountId.set(account.id, account.userId);
    }

    const tiktokAccountIds = allTiktokAccounts.map((a) => a.id);

    // Calculer les stats pour chaque créateur
    const creatorsWithStats: Array<CreatorListItem & { sortValue: number }> = await Promise.all(
      allCreators.map(async (creator) => {
        const creatorTiktokAccounts = tiktokAccountsByUserId.get(creator.id) || [];
        const creatorTiktokAccountIds = creatorTiktokAccounts.map((a) => a.id);
        const username = creatorTiktokAccounts.length > 0 ? creatorTiktokAccounts[0].username : null;

        // Vues totales
        let totalViews = 0;
        if (creatorTiktokAccountIds.length > 0) {
          const viewsResult = await db
            .select({
              totalViews: sql<number>`COALESCE(SUM(${videoStatsCurrent.views}), 0)`,
            })
            .from(campaignSubmissions)
            .innerJoin(videoStatsCurrent, eq(videoStatsCurrent.submissionId, campaignSubmissions.id))
            .where(
              and(
                inArray(campaignSubmissions.tiktokAccountId, creatorTiktokAccountIds),
                eq(campaignSubmissions.status, 'accepted')
              )
            );

          totalViews = Number(viewsResult[0]?.totalViews || 0);
        }

        // Total payé (campagnes + parrainage)
        let totalPaid = 0;

        // Factures campagnes payées
        if (creatorTiktokAccountIds.length > 0) {
          const campaignInvoicesResult = await db
            .select({
              totalPaid: sql<number>`COALESCE(SUM(${campaignRewards.amountEur}), 0)`,
            })
            .from(invoices)
            .innerJoin(campaignRewards, eq(campaignRewards.id, invoices.rewardId))
            .innerJoin(campaignSubmissions, eq(campaignSubmissions.id, invoices.submissionId))
            .where(
              and(
                inArray(campaignSubmissions.tiktokAccountId, creatorTiktokAccountIds),
                eq(invoices.status, 'paid')
              )
            );

          totalPaid += Number(campaignInvoicesResult[0]?.totalPaid || 0);
        }

        // Factures parrainage payées
        const referralInvoicesResult = await db
          .select({
            totalPaid: sql<number>`COALESCE(SUM(${referralInvoices.amountEur}), 0)`,
          })
          .from(referralInvoices)
          .where(
            and(
              eq(referralInvoices.userId, creator.id),
              eq(referralInvoices.status, 'paid')
            )
          );

        totalPaid += Number(referralInvoicesResult[0]?.totalPaid || 0);

        // Nombre de vidéos (soumissions acceptées)
        let videosCount = 0;
        if (creatorTiktokAccountIds.length > 0) {
          const videosResult = await db
            .select({
              count: count(),
            })
            .from(campaignSubmissions)
            .where(
              and(
                inArray(campaignSubmissions.tiktokAccountId, creatorTiktokAccountIds),
                eq(campaignSubmissions.status, 'accepted')
              )
            );

          videosCount = Number(videosResult[0]?.count || 0);
        }

        // Nombre de campagnes distinctes
        let campaignsCount = 0;
        if (creatorTiktokAccountIds.length > 0) {
          const campaignsResult = await db
            .select({
              count: sql<number>`COUNT(DISTINCT ${campaignSubmissions.campaignId})`,
            })
            .from(campaignSubmissions)
            .where(
              and(
                inArray(campaignSubmissions.tiktokAccountId, creatorTiktokAccountIds),
                eq(campaignSubmissions.status, 'accepted')
              )
            );

          campaignsCount = Number(campaignsResult[0]?.count || 0);
        }

        // Valeur de tri selon le paramètre sortBy
        let sortValue = 0;
        switch (sortBy) {
          case 'views':
            sortValue = totalViews;
            break;
          case 'paid':
            sortValue = totalPaid;
            break;
          case 'videos':
            sortValue = videosCount;
            break;
          case 'createdAt':
            sortValue = creator.createdAt.getTime();
            break;
          default:
            sortValue = totalViews;
        }

        return {
          id: creator.id,
          firstName: creator.firstName,
          lastName: creator.lastName,
          username,
          totalViews,
          totalPaid,
          videosCount,
          campaignsCount,
          createdAt: creator.createdAt.toISOString(),
          sortValue,
        };
      })
    );

    // Trier les créateurs
    creatorsWithStats.sort((a, b) => {
      if (sortBy === 'createdAt') {
        return direction === 'next' ? a.sortValue - b.sortValue : b.sortValue - a.sortValue;
      }
      // Pour les autres tris, trier par valeur décroissante (plus grand d'abord)
      return direction === 'next' ? b.sortValue - a.sortValue : a.sortValue - b.sortValue;
    });

    // Pagination par cursor (utiliser l'ID comme cursor après le tri)
    let filteredCreators = creatorsWithStats;
    if (cursor) {
      const cursorNum = parseInt(cursor as string, 10);
      if (!isNaN(cursorNum)) {
        // Trouver l'index du cursor dans la liste triée
        const cursorIndex = creatorsWithStats.findIndex((c) => c.id === cursorNum);
        if (cursorIndex !== -1) {
          if (direction === 'next') {
            filteredCreators = creatorsWithStats.slice(cursorIndex + 1);
          } else {
            filteredCreators = creatorsWithStats.slice(0, cursorIndex);
          }
        }
      }
    }

    // Appliquer la limite
    const hasMore = filteredCreators.length > limitNum;
    const items = hasMore ? filteredCreators.slice(0, limitNum) : filteredCreators;

    // Retirer sortValue des items finaux
    const finalItems: CreatorListItem[] = items.map(({ sortValue, ...item }) => item);

    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].id : null;

    const response: CreatorsListResponse = {
      items: finalItems,
      nextCursor,
      hasMore,
    };

    res.json(response);
  } catch (error) {
    console.error('[GetAllCreators] Erreur:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId: (req as Request & { user?: AuthUser }).user?.id,
    });
    res.status(500).json({ error: (error as Error).message, code: 'INTERNAL_SERVER_ERROR' });
  }
};

