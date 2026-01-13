import type { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../../db/index';
import { campaignSubmissions, campaigns, brands, tiktokAccounts, campaignRewards } from '../../db/schema';
import type { BrandSector } from '@shared/types/brands';
import type { RefuseSubmissionInput, SubmissionResponse } from '@shared/types/submissions';
import type { AuthUser } from '@shared/types/auth';
import { notificationService } from '../../services/notifications.service';

/**
 * Refuse une soumission
 * @route POST /api/submissions/:id/refuse
 * @param {RefuseSubmissionInput} req.body - Raison du refus (optionnel)
 * @returns {SubmissionResponse} Soumission refusée
 */
export const refuseSubmission = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as Request & { user?: AuthUser }).user?.id;
    const submissionId = parseInt(req.params.id, 10);

    if (!userId) {
      res.status(401).json({ error: 'Non authentifié', code: 'UNAUTHORIZED' });
      return;
    }

    if (isNaN(submissionId)) {
      res.status(400).json({ error: 'ID invalide', code: 'INVALID_ID' });
      return;
    }

    const { reason }: Pick<RefuseSubmissionInput, 'reason'> = req.body;

    // Récupérer la soumission
    const submission = await db
      .select()
      .from(campaignSubmissions)
      .where(eq(campaignSubmissions.id, submissionId))
      .limit(1);

    if (!submission[0]) {
      res.status(404).json({ error: 'Soumission non trouvée', code: 'SUBMISSION_NOT_FOUND' });
      return;
    }

    // Vérifier que l'utilisateur est propriétaire de la campagne
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
      res.status(403).json({ error: 'Non autorisé à refuser cette soumission', code: 'FORBIDDEN' });
      return;
    }

    if (submission[0].status !== 'pending') {
      res.status(400).json({ error: 'Soumission déjà traitée', code: 'SUBMISSION_ALREADY_PROCESSED' });
      return;
    }

    // Mettre à jour la soumission
    const [updated] = await db
      .update(campaignSubmissions)
      .set({
        status: 'refused',
        validatedAt: new Date(),
        refuseReason: reason ?? null,
      })
      .where(eq(campaignSubmissions.id, submissionId))
      .returning();

    // Envoyer une notification au créateur
    const tiktokAccount = await db
      .select()
      .from(tiktokAccounts)
      .where(eq(tiktokAccounts.id, submission[0].tiktokAccountId))
      .limit(1);

    if (tiktokAccount[0]) {
      await notificationService.notify(
        'submission_refused',
        tiktokAccount[0].userId,
        { campaignTitle: campaign[0].title, reason: reason ? `. Raison : ${reason}` : '' },
        { submissionId: updated.id, campaignId: campaign[0].id, reason: reason ?? null }
      );
    }

    // Récupérer les relations
    const [tiktokAccountData] = await db.select().from(tiktokAccounts).where(eq(tiktokAccounts.id, updated.tiktokAccountId)).limit(1);
    const [campaignData] = await db.select().from(campaigns).where(eq(campaigns.id, updated.campaignId)).limit(1);
    const [brandData] = await db.select().from(brands).where(eq(brands.id, campaignData.brandId)).limit(1);
    const rewardsData = await db.select().from(campaignRewards).where(eq(campaignRewards.campaignId, campaignData.id));

    const response: SubmissionResponse = {
      id: updated.id,
      campaignId: updated.campaignId,
      tiktokAccountId: updated.tiktokAccountId,
      tiktokVideoId: updated.tiktokVideoId,
      coverImageUrl: updated.coverImageUrl ?? null,
      status: updated.status,
      submittedAt: updated.submittedAt.toISOString(),
      validatedAt: updated.validatedAt?.toISOString() ?? null,
      refuseReason: updated.refuseReason,
      adsCode: updated.adsCode ?? null,
      campaign: {
        id: campaignData.id,
        brandId: campaignData.brandId,
        title: campaignData.title,
        description: campaignData.description,
        coverImageUrl: campaignData.coverImageUrl,
        youtubeUrl: campaignData.youtubeUrl,
        status: campaignData.status,
        startDate: campaignData.startDate?.toISOString() ?? null,
        endDate: campaignData.endDate?.toISOString() ?? null,
        createdAt: campaignData.createdAt.toISOString(),
        updatedAt: campaignData.updatedAt.toISOString(),
        brand: {
          id: brandData.id,
          userId: brandData.userId,
          name: brandData.name,
          sector: brandData.sector as BrandSector,
          website: brandData.website,
          logoUrl: brandData.logoUrl,
          createdAt: brandData.createdAt.toISOString(),
        },
        rewards: rewardsData.map(r => ({
          id: r.id,
          campaignId: r.campaignId,
          viewsTarget: r.viewsTarget,
          amountEur: r.amountEur,
          allowMultipleVideos: r.allowMultipleVideos,
          createdAt: r.createdAt.toISOString(),
        })),
      },
      tiktokAccount: {
        id: tiktokAccountData.id,
        userId: tiktokAccountData.userId,
        tiktokUserId: tiktokAccountData.tiktokUserId,
        username: tiktokAccountData.username,
        isValid: tiktokAccountData.isValid,
        expiresAt: tiktokAccountData.expiresAt.toISOString(),
        createdAt: tiktokAccountData.createdAt.toISOString(),
      },
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message, code: 'INTERNAL_SERVER_ERROR' });
  }
};



