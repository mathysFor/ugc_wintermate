import type { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../../db/index';
import { invoices, campaignSubmissions, campaignRewards, campaigns, brands, tiktokAccounts, users, referralCommissions } from '../../db/schema';
import type { InvoiceResponse } from '@shared/types/invoices';
import type { AuthUser } from '@shared/types/auth';
import { notificationService } from '../../services/notifications.service';

/**
 * Marque une facture comme payée
 * @route POST /api/invoices/:id/mark-paid
 * @returns {InvoiceResponse} Facture mise à jour
 */
export const markPaid = async (req: Request, res: Response): Promise<void> => {
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

    // Récupérer la facture
    const invoice = await db.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1);

    if (!invoice[0]) {
      res.status(404).json({ error: 'Facture non trouvée', code: 'INVOICE_NOT_FOUND' });
      return;
    }

    if (invoice[0].status === 'paid') {
      res.status(400).json({ error: 'Facture déjà payée', code: 'INVOICE_ALREADY_PAID' });
      return;
    }

    // Récupérer la soumission et vérifier que l'utilisateur est propriétaire de la campagne
    const submission = await db
      .select()
      .from(campaignSubmissions)
      .where(eq(campaignSubmissions.id, invoice[0].submissionId))
      .limit(1);

    if (!submission[0]) {
      res.status(404).json({ error: 'Soumission non trouvée', code: 'SUBMISSION_NOT_FOUND' });
      return;
    }

    const campaign = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, submission[0].campaignId))
      .limit(1);

    if (!campaign[0]) {
      res.status(404).json({ error: 'Campagne non trouvée', code: 'CAMPAIGN_NOT_FOUND' });
      return;
    }

    const brand = await db.select().from(brands).where(eq(brands.id, campaign[0].brandId)).limit(1);

    if (!brand[0] || brand[0].userId !== userId) {
      res.status(403).json({ error: 'Non autorisé à marquer cette facture comme payée', code: 'FORBIDDEN' });
      return;
    }

    // Marquer la facture comme payée
    const [updated] = await db
      .update(invoices)
      .set({
        status: 'paid',
        paidAt: new Date(),
      })
      .where(eq(invoices.id, invoiceId))
      .returning();

    // Notifier le créateur
    const tiktokAccount = await db
      .select()
      .from(tiktokAccounts)
      .where(eq(tiktokAccounts.id, submission[0].tiktokAccountId))
      .limit(1);

    const reward = await db
      .select()
      .from(campaignRewards)
      .where(eq(campaignRewards.id, invoice[0].rewardId))
      .limit(1);

    if (tiktokAccount[0] && reward[0]) {
      await notificationService.notify(
        'invoice_paid',
        tiktokAccount[0].userId,
        { campaignTitle: campaign[0].title, amount: (reward[0].amountEur / 100).toFixed(2) },
        { invoiceId: updated.id, amount: reward[0].amountEur }
      );

      // Créer une commission de parrainage si le créateur a un parrain
      const creatorId = tiktokAccount[0].userId;
      const creator = await db
        .select({ referredById: users.referredById })
        .from(users)
        .where(eq(users.id, creatorId))
        .limit(1);

      if (creator[0]?.referredById) {
        // Récupérer le pourcentage de commission du parrain
        const referrer = await db
          .select({ id: users.id, referralPercentage: users.referralPercentage })
          .from(users)
          .where(eq(users.id, creator[0].referredById))
          .limit(1);

        if (referrer[0]) {
          const commissionAmount = Math.floor(reward[0].amountEur * referrer[0].referralPercentage / 100);

          if (commissionAmount > 0) {
            await db.insert(referralCommissions).values({
              referrerId: referrer[0].id,
              refereeId: creatorId,
              invoiceId: updated.id,
              amountEur: commissionAmount,
              status: 'available',
            });

            // Notifier le parrain de la commission gagnée
            const referee = await db
              .select({ firstName: users.firstName, lastName: users.lastName })
              .from(users)
              .where(eq(users.id, creatorId))
              .limit(1);

            if (referee[0]) {
              await notificationService.notify(
                'referral_commission_earned',
                referrer[0].id,
                { 
                  amount: (commissionAmount / 100).toFixed(2), 
                  refereeName: `${referee[0].firstName} ${referee[0].lastName}` 
                },
                { commissionAmount, refereeId: creatorId, invoiceId: updated.id }
              );
            }
          }
        }
      }
    }

    // Récupérer les relations nécessaires
    const [submissionData] = await db
      .select({
        id: campaignSubmissions.id,
        campaignId: campaignSubmissions.campaignId,
        tiktokAccountId: campaignSubmissions.tiktokAccountId,
        tiktokVideoId: campaignSubmissions.tiktokVideoId,
        coverImageUrl: campaignSubmissions.coverImageUrl,
        status: campaignSubmissions.status,
        submittedAt: campaignSubmissions.submittedAt,
        validatedAt: campaignSubmissions.validatedAt,
        refuseReason: campaignSubmissions.refuseReason,
        adsCode: campaignSubmissions.adsCode,
      })
      .from(campaignSubmissions)
      .where(eq(campaignSubmissions.id, updated.submissionId))
      .limit(1);

    const [rewardData] = await db
      .select()
      .from(campaignRewards)
      .where(eq(campaignRewards.id, updated.rewardId))
      .limit(1);

    const [campaignData] = await db
      .select({
        id: campaigns.id,
        title: campaigns.title,
        coverImageUrl: campaigns.coverImageUrl,
      })
      .from(campaigns)
      .where(eq(campaigns.id, submissionData.campaignId))
      .limit(1);

    const [brandData] = await db
      .select({ name: brands.name })
      .from(brands)
      .where(eq(brands.id, campaign[0].brandId))
      .limit(1);

    const response: InvoiceResponse = {
      id: updated.id,
      submissionId: updated.submissionId,
      rewardId: updated.rewardId,
      pdfUrl: updated.pdfUrl,
      paymentMethod: updated.paymentMethod,
      status: updated.status,
      uploadedAt: updated.uploadedAt.toISOString(),
      paidAt: updated.paidAt?.toISOString() ?? null,
      submission: {
        id: submissionData.id,
        campaignId: submissionData.campaignId,
        tiktokAccountId: submissionData.tiktokAccountId,
        tiktokVideoId: submissionData.tiktokVideoId,
        coverImageUrl: submissionData.coverImageUrl,
        status: submissionData.status,
        submittedAt: submissionData.submittedAt.toISOString(),
        validatedAt: submissionData.validatedAt?.toISOString() ?? null,
        refuseReason: submissionData.refuseReason,
        adsCode: submissionData.adsCode,
      },
      reward: {
        id: rewardData.id,
        campaignId: rewardData.campaignId,
        viewsTarget: rewardData.viewsTarget,
        amountEur: rewardData.amountEur,
        allowMultipleVideos: rewardData.allowMultipleVideos,
        createdAt: rewardData.createdAt.toISOString(),
      },
      campaign: {
        id: campaignData.id,
        title: campaignData.title,
        coverImageUrl: campaignData.coverImageUrl,
        brandName: brandData.name,
      },
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message, code: 'INTERNAL_SERVER_ERROR' });
  }
};



