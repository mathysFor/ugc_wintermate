import type { Request, Response } from 'express';
import { sql, asc, desc } from 'drizzle-orm';
import { db } from '../../db/index';
import { referralInvoices } from '../../db/schema';
import type { PaginatedReferralInvoicesResponse } from '@shared/types/referral';
import type { AuthUser } from '@shared/types/auth';

/**
 * Récupère la liste des factures de parrainage du créateur connecté
 * @route GET /api/referral/invoices
 * @param {string} cursor - Cursor pour la pagination
 * @param {number} limit - Nombre d'éléments par page (max 100)
 * @param {string} direction - Direction de pagination ('next' | 'prev')
 * @returns {PaginatedReferralInvoicesResponse} Liste paginée des factures
 */
export const getReferralInvoices = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as Request & { user?: AuthUser }).user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Non authentifié', code: 'UNAUTHORIZED' });
      return;
    }

    const { cursor, limit = '10', direction = 'next' } = req.query;
    const parsedLimit = Math.min(Math.max(1, parseInt(limit as string, 10) || 10), 100);

    // Construire la requête de base
    let whereClause = sql`${referralInvoices.userId} = ${userId}`;

    // Appliquer le cursor si présent
    if (cursor) {
      const cursorId = parseInt(cursor as string, 10);
      if (!isNaN(cursorId)) {
        if (direction === 'next') {
          whereClause = sql`${referralInvoices.userId} = ${userId} AND ${referralInvoices.id} > ${cursorId}`;
        } else {
          whereClause = sql`${referralInvoices.userId} = ${userId} AND ${referralInvoices.id} < ${cursorId}`;
        }
      }
    }

    const results = await db
      .select()
      .from(referralInvoices)
      .where(whereClause)
      .orderBy(direction === 'next' ? asc(referralInvoices.id) : desc(referralInvoices.id))
      .limit(parsedLimit + 1);

    const hasMore = results.length > parsedLimit;
    const items = hasMore ? results.slice(0, -1) : results;
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].id : null;

    const response: PaginatedReferralInvoicesResponse = {
      items: items.map((invoice) => ({
        id: invoice.id,
        userId: invoice.userId,
        pdfUrl: invoice.pdfUrl,
        paymentMethod: invoice.paymentMethod,
        amountEur: invoice.amountEur,
        status: invoice.status,
        uploadedAt: invoice.uploadedAt.toISOString(),
        paidAt: invoice.paidAt?.toISOString() ?? null,
      })),
      nextCursor,
      hasMore,
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message, code: 'INTERNAL_SERVER_ERROR' });
  }
};

