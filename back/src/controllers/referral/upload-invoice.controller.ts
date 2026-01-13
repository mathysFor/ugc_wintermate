import type { Request, Response } from 'express';
import { eq, sql } from 'drizzle-orm';
import { db } from '../../db/index';
import { referralInvoices, referralCommissions, users, brands } from '../../db/schema';
import type { ReferralInvoiceResponse } from '@shared/types/referral';
import type { PaymentMethod } from '@shared/types/invoices';
import type { AuthUser } from '@shared/types/auth';
import { cloudflareR2Service } from '../../services/cloudflare-r2.service';
import { notificationService } from '../../services/notifications.service';

/**
 * Upload une facture pour retirer les commissions de parrainage
 * @route POST /api/referral/invoices
 * @param {File} req.file - Fichier PDF (via multer) - optionnel si paymentMethod === 'gift_card'
 * @param {number} req.body.amountEur - Montant demandé en centimes
 * @param {string} req.body.paymentMethod - Méthode de paiement ('invoice' | 'gift_card')
 * @returns {ReferralInvoiceResponse} Facture créée
 */
export const uploadReferralInvoice = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as Request & { user?: AuthUser }).user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Non authentifié', code: 'UNAUTHORIZED' });
      return;
    }

    const { amountEur, paymentMethod: paymentMethodRaw } = req.body;

    // Valider la méthode de paiement
    const paymentMethod: PaymentMethod = paymentMethodRaw === 'gift_card' ? 'gift_card' : 'invoice';

    // Récupérer le fichier uploadé par multer
    const file = req.file;

    // Si méthode de paiement = facture, le fichier PDF est obligatoire
    if (paymentMethod === 'invoice') {
      if (!file) {
        res.status(400).json({ error: 'Fichier PDF requis pour un paiement par facture', code: 'FILE_REQUIRED' });
        return;
      }

      // Valider le type MIME
      if (file.mimetype !== 'application/pdf') {
        res.status(400).json({ error: 'Seuls les fichiers PDF sont acceptés', code: 'INVALID_FILE_TYPE' });
        return;
      }
    }
    const parsedAmount = parseInt(amountEur, 10);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      res.status(400).json({ error: 'Montant invalide', code: 'INVALID_AMOUNT' });
      return;
    }

    // Vérifier le montant disponible
    const availableResult = await db
      .select({ total: sql<number>`COALESCE(SUM(amount_eur), 0)::int` })
      .from(referralCommissions)
      .where(sql`${referralCommissions.referrerId} = ${userId} AND ${referralCommissions.status} = 'available'`);

    const availableAmount = availableResult[0]?.total ?? 0;

    if (parsedAmount > availableAmount) {
      res.status(400).json({ 
        error: `Montant demandé (${parsedAmount / 100}€) supérieur au montant disponible (${availableAmount / 100}€)`, 
        code: 'INSUFFICIENT_BALANCE' 
      });
      return;
    }

    // Upload du fichier vers Cloudflare R2 (uniquement si paiement par facture)
    let pdfUrl: string | null = null;
    if (paymentMethod === 'invoice' && file) {
      pdfUrl = await cloudflareR2Service.uploadFile(
        file.buffer,
        file.originalname,
        file.mimetype
      );
    }

    // Créer la facture
    const [created] = await db
      .insert(referralInvoices)
      .values({
        userId,
        pdfUrl,
        paymentMethod,
        amountEur: parsedAmount,
        status: 'uploaded',
      })
      .returning();

    // Marquer les commissions comme withdrawn jusqu'à concurrence du montant
    let remainingAmount = parsedAmount;
    const availableCommissions = await db
      .select()
      .from(referralCommissions)
      .where(sql`${referralCommissions.referrerId} = ${userId} AND ${referralCommissions.status} = 'available'`)
      .orderBy(referralCommissions.createdAt);

    for (const commission of availableCommissions) {
      if (remainingAmount <= 0) break;

      if (commission.amountEur <= remainingAmount) {
        // Marquer toute la commission comme withdrawn
        await db
          .update(referralCommissions)
          .set({ status: 'withdrawn' })
          .where(eq(referralCommissions.id, commission.id));
        remainingAmount -= commission.amountEur;
      } else {
        // Cas où on retire une partie seulement (rare, mais possible)
        // On marque toute la commission comme withdrawn pour simplifier
        await db
          .update(referralCommissions)
          .set({ status: 'withdrawn' })
          .where(eq(referralCommissions.id, commission.id));
        remainingAmount = 0;
      }
    }

    // Notifier toutes les marques via Slack (fire and forget)
    const creator = await db
      .select({ firstName: users.firstName, lastName: users.lastName })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (creator[0]) {
      const creatorName = `${creator[0].firstName} ${creator[0].lastName}`;
      const allBrands = await db.select({ userId: brands.userId }).from(brands);

      for (const brand of allBrands) {
        notificationService.notify(
          'referral_invoice_uploaded',
          brand.userId,
          { creatorName, amount: (parsedAmount / 100).toFixed(2) },
          { referralInvoiceId: created.id, creatorUserId: userId }
        ).catch((error) => {
          console.error('[uploadReferralInvoice] Erreur notification marque:', (error as Error).message);
        });
      }
    }

    const response: ReferralInvoiceResponse = {
      id: created.id,
      userId: created.userId,
      pdfUrl: created.pdfUrl,
      paymentMethod: created.paymentMethod,
      amountEur: created.amountEur,
      status: created.status,
      uploadedAt: created.uploadedAt.toISOString(),
      paidAt: created.paidAt?.toISOString() ?? null,
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('[uploadReferralInvoice] Erreur:', error);
    res.status(500).json({ error: (error as Error).message, code: 'INTERNAL_SERVER_ERROR' });
  }
};

