import type { Request, Response } from 'express';
import { eq, sql, asc, desc } from 'drizzle-orm';
import { db } from '../../db/index';
import { referralCommissions, users, invoices, campaignSubmissions, campaigns, campaignRewards } from '../../db/schema';
import type { PaginatedReferralCommissionsResponse, ReferralCommissionWithReferee } from '@shared/types/referral';
import type { AuthUser } from '@shared/types/auth';

/**
 * Récupère la liste des commissions de parrainage du créateur connecté
 * @route GET /api/referral/commissions
 * @param {string} cursor - Cursor pour la pagination
 * @param {number} limit - Nombre d'éléments par page (max 100)
 * @param {string} direction - Direction de pagination ('next' | 'prev')
 * @returns {PaginatedReferralCommissionsResponse} Liste paginée des commissions
 */
export const getCommissions = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as Request & { user?: AuthUser }).user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Non authentifié', code: 'UNAUTHORIZED' });
      return;
    }

    const { cursor, limit = '10', direction = 'next' } = req.query;
    const parsedLimit = Math.min(Math.max(1, parseInt(limit as string, 10) || 10), 100);

    // Construire la requête de base
    let whereClause = sql`${referralCommissions.referrerId} = ${userId}`;

    // Appliquer le cursor si présent
    if (cursor) {
      const cursorId = parseInt(cursor as string, 10);
      if (!isNaN(cursorId)) {
        if (direction === 'next') {
          whereClause = sql`${referralCommissions.referrerId} = ${userId} AND ${referralCommissions.id} > ${cursorId}`;
        } else {
          whereClause = sql`${referralCommissions.referrerId} = ${userId} AND ${referralCommissions.id} < ${cursorId}`;
        }
      }
    }

    const results = await db
      .select()
      .from(referralCommissions)
      .where(whereClause)
      .orderBy(direction === 'next' ? asc(referralCommissions.id) : desc(referralCommissions.id))
      .limit(parsedLimit + 1);

    const hasMore = results.length > parsedLimit;
    const items = hasMore ? results.slice(0, -1) : results;
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].id : null;

    // Enrichir avec les infos du filleul et de la campagne
    const commissionsWithDetails: ReferralCommissionWithReferee[] = await Promise.all(
      items.map(async (commission) => {
        // Récupérer le filleul
        const referee = await db
          .select({
            id: users.id,
            email: users.email,
            firstName: users.firstName,
            lastName: users.lastName,
            isCreator: users.isCreator,
            isBrand: users.isBrand,
            createdAt: users.createdAt,
          })
          .from(users)
          .where(eq(users.id, commission.refereeId))
          .limit(1);

        // Récupérer les infos de la campagne via la facture
        const invoice = await db
          .select()
          .from(invoices)
          .where(eq(invoices.id, commission.invoiceId))
          .limit(1);

        let campaignTitle = 'Campagne inconnue';
        let rewardViewsTarget = 0;

        if (invoice[0]) {
          const submission = await db
            .select()
            .from(campaignSubmissions)
            .where(eq(campaignSubmissions.id, invoice[0].submissionId))
            .limit(1);

          if (submission[0]) {
            const campaign = await db
              .select({ title: campaigns.title })
              .from(campaigns)
              .where(eq(campaigns.id, submission[0].campaignId))
              .limit(1);

            if (campaign[0]) {
              campaignTitle = campaign[0].title;
            }
          }

          const reward = await db
            .select({ viewsTarget: campaignRewards.viewsTarget })
            .from(campaignRewards)
            .where(eq(campaignRewards.id, invoice[0].rewardId))
            .limit(1);

          if (reward[0]) {
            rewardViewsTarget = reward[0].viewsTarget;
          }
        }

        return {
          id: commission.id,
          referrerId: commission.referrerId,
          refereeId: commission.refereeId,
          invoiceId: commission.invoiceId,
          amountEur: commission.amountEur,
          status: commission.status,
          createdAt: commission.createdAt.toISOString(),
          referee: referee[0] ? {
            id: referee[0].id,
            email: referee[0].email,
            firstName: referee[0].firstName,
            lastName: referee[0].lastName,
            isCreator: referee[0].isCreator,
            isBrand: referee[0].isBrand,
            createdAt: referee[0].createdAt.toISOString(),
          } : {
            id: commission.refereeId,
            email: '',
            firstName: 'Inconnu',
            lastName: '',
            isCreator: false,
            isBrand: false,
            createdAt: new Date().toISOString(),
          },
          campaignTitle,
          rewardViewsTarget,
        };
      })
    );

    const response: PaginatedReferralCommissionsResponse = {
      items: commissionsWithDetails,
      nextCursor,
      hasMore,
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message, code: 'INTERNAL_SERVER_ERROR' });
  }
};





