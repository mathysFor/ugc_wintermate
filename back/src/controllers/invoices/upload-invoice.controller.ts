import type { Request, Response } from 'express';
import { eq, and, inArray } from 'drizzle-orm';
import { db } from '../../db/index';
import { invoices, campaignSubmissions, campaignRewards, campaigns, tiktokAccounts, brands, users } from '../../db/schema';
import type { InvoiceResponse, AdsCodeInput, PaymentMethod } from '@shared/types/invoices';
import type { AuthUser } from '@shared/types/auth';
import { notificationService } from '../../services/notifications.service';
import { cloudflareR2Service } from '../../services/cloudflare-r2.service';

/**
 * Upload une facture pour une soumission
 * @route POST /api/invoices
 * @param {File} req.file - Fichier PDF (via multer) - optionnel si paymentMethod === 'gift_card'
 * @param {number} req.body.submissionId - ID de la soumission (ancre)
 * @param {number} req.body.rewardId - ID du palier de récompense
 * @param {string} req.body.paymentMethod - Méthode de paiement ('invoice' | 'gift_card')
 * @param {string} req.body.adsCodes - JSON stringifié des codes d'ads pour chaque soumission acceptée
 * @returns {InvoiceResponse} Facture créée
 */
export const uploadInvoice = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as Request & { user?: AuthUser }).user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Non authentifié', code: 'UNAUTHORIZED' });
      return;
    }

    const { submissionId, rewardId, adsCodes: adsCodesRaw, paymentMethod: paymentMethodRaw } = req.body;

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

    if (!submissionId || !rewardId) {
      res.status(400).json({ error: 'submissionId et rewardId requis', code: 'FIELDS_REQUIRED' });
      return;
    }

    // Parser les codes d'ads (envoyés en JSON stringifié via FormData)
    let adsCodes: AdsCodeInput[] = [];
    if (adsCodesRaw) {
      try {
        adsCodes = JSON.parse(adsCodesRaw);
      } catch {
        res.status(400).json({ error: 'Format adsCodes invalide', code: 'INVALID_ADS_CODES_FORMAT' });
        return;
      }
    }

    const parsedSubmissionId = parseInt(submissionId, 10);
    const parsedRewardId = parseInt(rewardId, 10);

    if (isNaN(parsedSubmissionId) || isNaN(parsedRewardId)) {
      res.status(400).json({ error: 'submissionId et rewardId doivent être des nombres', code: 'INVALID_IDS' });
      return;
    }

    // Vérifier que la soumission existe et appartient à l'utilisateur
    const submission = await db
      .select()
      .from(campaignSubmissions)
      .where(eq(campaignSubmissions.id, parsedSubmissionId))
      .limit(1);

    if (!submission[0]) {
      res.status(404).json({ error: 'Soumission non trouvée', code: 'SUBMISSION_NOT_FOUND' });
      return;
    }

    // Vérifier que le compte TikTok appartient à l'utilisateur
    const tiktokAccount = await db
      .select()
      .from(tiktokAccounts)
      .where(eq(tiktokAccounts.id, submission[0].tiktokAccountId))
      .limit(1);

    if (!tiktokAccount[0] || tiktokAccount[0].userId !== userId) {
      res.status(403).json({ error: 'Non autorisé à uploader une facture pour cette soumission', code: 'FORBIDDEN' });
      return;
    }

    // Vérifier que la soumission est acceptée
    if (submission[0].status !== 'accepted') {
      res.status(400).json({ error: 'La soumission doit être acceptée pour déposer une facture', code: 'SUBMISSION_NOT_ACCEPTED' });
      return;
    }

    // Vérifier que le palier existe et appartient à la campagne
    const reward = await db
      .select()
      .from(campaignRewards)
      .where(and(eq(campaignRewards.id, parsedRewardId), eq(campaignRewards.campaignId, submission[0].campaignId)))
      .limit(1);

    if (!reward[0]) {
      res.status(404).json({ error: 'Palier non trouvé pour cette campagne', code: 'REWARD_NOT_FOUND' });
      return;
    }

    // Vérifier qu'une facture n'existe pas déjà pour ce palier
    const existingInvoice = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.submissionId, parsedSubmissionId), eq(invoices.rewardId, parsedRewardId)))
      .limit(1);

    if (existingInvoice[0]) {
      res.status(409).json({ error: 'Une facture existe déjà pour ce palier', code: 'INVOICE_EXISTS' });
      return;
    }

    // Récupérer tous les comptes TikTok de l'utilisateur
    const userTiktokAccounts = await db
      .select()
      .from(tiktokAccounts)
      .where(eq(tiktokAccounts.userId, userId));

    const accountIds = userTiktokAccounts.map((a) => a.id);

    // Récupérer toutes les soumissions acceptées de l'utilisateur pour cette campagne
    const userAcceptedSubmissions = await db
      .select()
      .from(campaignSubmissions)
      .where(
        and(
          eq(campaignSubmissions.campaignId, submission[0].campaignId),
          eq(campaignSubmissions.status, 'accepted'),
          inArray(campaignSubmissions.tiktokAccountId, accountIds)
        )
      );

    // Vérifier que tous les codes d'ads sont fournis pour les soumissions acceptées
    const acceptedSubmissionIds = userAcceptedSubmissions.map((s) => s.id);
    const providedAdsCodesMap = new Map(adsCodes.map((ac) => [ac.submissionId, ac.adsCode]));

    // Vérifier que chaque soumission acceptée a un code d'ads
    const missingAdsCodes: number[] = [];
    for (const subId of acceptedSubmissionIds) {
      const adsCode = providedAdsCodesMap.get(subId);
      if (!adsCode || adsCode.trim() === '') {
        missingAdsCodes.push(subId);
      }
    }

    if (missingAdsCodes.length > 0) {
      res.status(400).json({ 
        error: `Codes d'ads manquants pour ${missingAdsCodes.length} vidéo(s) acceptée(s)`, 
        code: 'MISSING_ADS_CODES',
        missingSubmissionIds: missingAdsCodes
      });
      return;
    }

    // Mettre à jour les soumissions avec les codes d'ads
    for (const adsCodeEntry of adsCodes) {
      // Vérifier que la soumission appartient bien à l'utilisateur
      if (acceptedSubmissionIds.includes(adsCodeEntry.submissionId)) {
        await db
          .update(campaignSubmissions)
          .set({ adsCode: adsCodeEntry.adsCode.trim() })
          .where(eq(campaignSubmissions.id, adsCodeEntry.submissionId));
      }
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
      .insert(invoices)
      .values({
        submissionId: parsedSubmissionId,
        rewardId: parsedRewardId,
        pdfUrl,
        paymentMethod,
        status: 'uploaded',
      })
      .returning();

    // Notifier la marque
    const campaign = await db.select().from(campaigns).where(eq(campaigns.id, submission[0].campaignId)).limit(1);
    const brand = await db.select().from(brands).where(eq(brands.id, campaign[0].brandId)).limit(1);
    const creator = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (brand[0] && creator[0]) {
      await notificationService.notify(
        'invoice_uploaded',
        brand[0].userId,
        { campaignTitle: campaign[0].title, creatorName: `${creator[0].firstName} ${creator[0].lastName}` },
        { invoiceId: created.id }
      );
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
      .where(eq(campaignSubmissions.id, created.submissionId))
      .limit(1);

    const [rewardData] = await db
      .select()
      .from(campaignRewards)
      .where(eq(campaignRewards.id, created.rewardId))
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
      id: created.id,
      submissionId: created.submissionId,
      rewardId: created.rewardId,
      pdfUrl: created.pdfUrl,
      paymentMethod: created.paymentMethod,
      status: created.status,
      uploadedAt: created.uploadedAt.toISOString(),
      paidAt: created.paidAt?.toISOString() ?? null,
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

    res.status(201).json(response);
  } catch (error) {
    console.error('[uploadInvoice] Erreur:', error);
    res.status(500).json({ error: (error as Error).message, code: 'INTERNAL_SERVER_ERROR' });
  }
};
