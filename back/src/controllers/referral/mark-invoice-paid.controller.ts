import type { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../../db/index';
import { referralInvoices, users } from '../../db/schema';
import type { ReferralInvoiceResponse } from '@shared/types/referral';
import type { AuthUser } from '@shared/types/auth';
import { notificationService } from '../../services/notifications.service';

/**
 * Marque une facture de parrainage comme payée (réservé aux admins/marques)
 * @route POST /api/referral/invoices/:id/mark-paid
 * @returns {ReferralInvoiceResponse} Facture mise à jour
 */
export const markReferralInvoicePaid = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as Request & { user?: AuthUser }).user?.id;
    const invoiceId = parseInt(req.params.id, 10);

    if (!userId) {
      res.status(401).json({ error: 'Non authentifié', code: 'UNAUTHORIZED' });
      return;
    }

    if (isNaN(invoiceId)) {
      res.status(400).json({ error: 'ID invalide', code: 'INVALID_ID' });
      return;
    }

    // Vérifier que l'utilisateur est une marque (admin)
    const user = await db
      .select({ isBrand: users.isBrand })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user[0]?.isBrand) {
      res.status(403).json({ error: 'Seules les marques peuvent marquer les factures comme payées', code: 'FORBIDDEN' });
      return;
    }

    // Récupérer la facture
    const invoice = await db
      .select()
      .from(referralInvoices)
      .where(eq(referralInvoices.id, invoiceId))
      .limit(1);

    if (!invoice[0]) {
      res.status(404).json({ error: 'Facture non trouvée', code: 'INVOICE_NOT_FOUND' });
      return;
    }

    if (invoice[0].status === 'paid') {
      res.status(400).json({ error: 'Facture déjà payée', code: 'INVOICE_ALREADY_PAID' });
      return;
    }

    // Marquer la facture comme payée
    const [updated] = await db
      .update(referralInvoices)
      .set({
        status: 'paid',
        paidAt: new Date(),
      })
      .where(eq(referralInvoices.id, invoiceId))
      .returning();

    // Notifier le créateur que sa facture de parrainage a été payée
    await notificationService.notify(
      'referral_invoice_paid',
      invoice[0].userId,
      { amount: (updated.amountEur / 100).toFixed(2) },
      { referralInvoiceId: updated.id }
    );

    const response: ReferralInvoiceResponse = {
      id: updated.id,
      userId: updated.userId,
      pdfUrl: updated.pdfUrl,
      paymentMethod: updated.paymentMethod,
      amountEur: updated.amountEur,
      status: updated.status,
      uploadedAt: updated.uploadedAt.toISOString(),
      paidAt: updated.paidAt?.toISOString() ?? null,
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message, code: 'INTERNAL_SERVER_ERROR' });
  }
};

