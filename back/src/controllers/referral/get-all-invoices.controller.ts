import type { Request, Response } from 'express';
import { eq, gt, lt, asc, desc, and, count } from 'drizzle-orm';
import { db } from '../../db/index';
import { referralInvoices, users } from '../../db/schema';
import type { AuthUser } from '@shared/types/auth';
import type { PaymentMethod } from '@shared/types/invoices';

/**
 * Type pour les factures de parrainage avec infos créateur (pour les marques)
 */
type ReferralInvoiceWithCreator = {
  id: number;
  userId: number;
  pdfUrl: string | null;
  paymentMethod: PaymentMethod;
  amountEur: number;
  status: 'uploaded' | 'paid';
  uploadedAt: string;
  paidAt: string | null;
  creator: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
};

type PaginatedReferralInvoicesForBrandResponse = {
  items: ReferralInvoiceWithCreator[];
  nextCursor: number | null;
  hasMore: boolean;
  pendingCount: number;
};

/**
 * Récupère toutes les factures de parrainage (réservé aux marques)
 * @route GET /api/referral/invoices/all
 * @param {string} cursor - Cursor pour la pagination
 * @param {number} limit - Nombre d'éléments par page (max 100)
 * @param {string} status - Filtre par statut (uploaded/paid)
 * @returns {PaginatedReferralInvoicesForBrandResponse} Liste paginée des factures
 */
export const getAllReferralInvoices = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as Request & { user?: AuthUser }).user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Non authentifié', code: 'UNAUTHORIZED' });
      return;
    }

    // Vérifier que l'utilisateur est une marque
    const user = await db
      .select({ isBrand: users.isBrand })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user[0]?.isBrand) {
      res.status(403).json({ error: 'Réservé aux marques', code: 'FORBIDDEN' });
      return;
    }

    const { cursor, limit = '10', direction = 'next', status } = req.query;
    const limitNum = Math.min(Math.max(parseInt(limit as string, 10) || 10, 1), 100);

    // Compter les factures en attente (indépendamment du filtre)
    const [pendingCountResult] = await db
      .select({ count: count() })
      .from(referralInvoices)
      .where(eq(referralInvoices.status, 'uploaded'));
    const pendingCount = pendingCountResult?.count ?? 0;

    // Construire les conditions
    const conditions: ReturnType<typeof eq>[] = [];

    if (status) {
      conditions.push(eq(referralInvoices.status, status as 'uploaded' | 'paid'));
    }

    if (cursor) {
      const cursorNum = parseInt(cursor as string, 10);
      if (!isNaN(cursorNum)) {
        if (direction === 'next') {
          conditions.push(gt(referralInvoices.id, cursorNum));
        } else {
          conditions.push(lt(referralInvoices.id, cursorNum));
        }
      }
    }

    const invoiceList = await db
      .select()
      .from(referralInvoices)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(direction === 'next' ? asc(referralInvoices.id) : desc(referralInvoices.id))
      .limit(limitNum + 1);

    const hasMore = invoiceList.length > limitNum;
    const items = hasMore ? invoiceList.slice(0, -1) : invoiceList;

    // Récupérer les infos des créateurs
    const invoicesWithCreator: ReferralInvoiceWithCreator[] = await Promise.all(
      items.map(async (invoice) => {
        const [creator] = await db
          .select({
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
          })
          .from(users)
          .where(eq(users.id, invoice.userId))
          .limit(1);

        return {
          id: invoice.id,
          userId: invoice.userId,
          pdfUrl: invoice.pdfUrl,
          paymentMethod: invoice.paymentMethod,
          amountEur: invoice.amountEur,
          status: invoice.status,
          uploadedAt: invoice.uploadedAt.toISOString(),
          paidAt: invoice.paidAt?.toISOString() ?? null,
          creator: creator ?? { id: invoice.userId, firstName: 'Inconnu', lastName: '', email: '' },
        };
      })
    );

    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].id : null;

    const response: PaginatedReferralInvoicesForBrandResponse = {
      items: invoicesWithCreator,
      nextCursor,
      hasMore,
      pendingCount,
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message, code: 'INTERNAL_SERVER_ERROR' });
  }
};

