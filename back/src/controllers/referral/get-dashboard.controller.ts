import type { Request, Response } from 'express';
import { eq, sql } from 'drizzle-orm';
import { db } from '../../db/index';
import { users, referralCommissions, referralInvoices } from '../../db/schema';
import type { ReferralDashboardResponse } from '@shared/types/referral';
import type { AuthUser } from '@shared/types/auth';

/**
 * Récupère le dashboard de parrainage du créateur connecté
 * @route GET /api/referral/dashboard
 * @returns {ReferralDashboardResponse} Statistiques de parrainage
 */
export const getReferralDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as Request & { user?: AuthUser }).user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Non authentifié', code: 'UNAUTHORIZED' });
      return;
    }

    // Récupérer l'utilisateur avec son code et pourcentage
    const user = await db
      .select({
        referralCode: users.referralCode,
        referralPercentage: users.referralPercentage,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user[0]) {
      res.status(404).json({ error: 'Utilisateur non trouvé', code: 'USER_NOT_FOUND' });
      return;
    }

    // Compter les filleuls
    const refereeCountResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(eq(users.referredById, userId));

    const refereeCount = refereeCountResult[0]?.count ?? 0;

    // Calculer le montant disponible (commissions avec status 'available')
    const availableResult = await db
      .select({ total: sql<number>`COALESCE(SUM(amount_eur), 0)::int` })
      .from(referralCommissions)
      .where(sql`${referralCommissions.referrerId} = ${userId} AND ${referralCommissions.status} = 'available'`);

    const availableAmount = availableResult[0]?.total ?? 0;

    // Calculer le montant retiré (factures de parrainage payées)
    const withdrawnResult = await db
      .select({ total: sql<number>`COALESCE(SUM(amount_eur), 0)::int` })
      .from(referralInvoices)
      .where(sql`${referralInvoices.userId} = ${userId} AND ${referralInvoices.status} = 'paid'`);

    const withdrawnAmount = withdrawnResult[0]?.total ?? 0;

    // Calculer le montant en attente (factures de parrainage uploadées)
    const pendingResult = await db
      .select({ total: sql<number>`COALESCE(SUM(amount_eur), 0)::int` })
      .from(referralInvoices)
      .where(sql`${referralInvoices.userId} = ${userId} AND ${referralInvoices.status} = 'uploaded'`);

    const pendingAmount = pendingResult[0]?.total ?? 0;

    const response: ReferralDashboardResponse = {
      referralCode: user[0].referralCode ?? '',
      referralPercentage: user[0].referralPercentage,
      availableAmount,
      withdrawnAmount,
      pendingAmount,
      refereeCount,
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message, code: 'INTERNAL_SERVER_ERROR' });
  }
};





