import type { Request, Response } from 'express';
import { eq, and } from 'drizzle-orm';
import { db } from '../../db/index';
import { campaignSubmissions, campaigns, tiktokAccounts, videoStatsCurrent, brands, users, campaignRewards } from '../../db/schema';
import type { BrandSector } from '@shared/types/brands';
import type { CreateSubmissionInput, SubmissionResponse } from '@shared/types/submissions';
import type { AuthUser } from '@shared/types/auth';
import { notificationService } from '../../services/notifications.service';

/**
 * Crée une nouvelle soumission de vidéo
 * @route POST /api/campaigns/:id/submit
 * @param {CreateSubmissionInput} req.body - Données de soumission
 * @returns {SubmissionResponse} Soumission créée
 */
export const createSubmission = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as Request & { user?: AuthUser }).user?.id;
    const campaignId = parseInt(req.params.id, 10);

    if (!userId) {
      res.status(401).json({ error: 'Non authentifié', code: 'UNAUTHORIZED' });
      return;
    }

    if (isNaN(campaignId)) {
      res.status(400).json({ error: 'ID de campagne invalide', code: 'INVALID_ID' });
      return;
    }

    const { tiktokAccountId, tiktokVideoId, coverImageUrl }: Omit<CreateSubmissionInput, 'campaignId'> = req.body;

    if (!tiktokAccountId || !tiktokVideoId) {
      res.status(400).json({ error: 'Compte TikTok et ID vidéo requis', code: 'FIELDS_REQUIRED' });
      return;
    }

    // Vérifier que la campagne existe et est active
    const campaign = await db.select().from(campaigns).where(eq(campaigns.id, campaignId)).limit(1);

    if (!campaign[0]) {
      res.status(404).json({ error: 'Campagne non trouvée', code: 'CAMPAIGN_NOT_FOUND' });
      return;
    }

    if (campaign[0].status !== 'active') {
      res.status(400).json({ error: 'La campagne n\'est pas active', code: 'CAMPAIGN_NOT_ACTIVE' });
      return;
    }

    // Vérifier que le compte TikTok appartient à l'utilisateur
    const tiktokAccount = await db
      .select()
      .from(tiktokAccounts)
      .where(and(eq(tiktokAccounts.id, tiktokAccountId), eq(tiktokAccounts.userId, userId)))
      .limit(1);

    if (!tiktokAccount[0]) {
      res.status(403).json({ error: 'Compte TikTok non trouvé ou non autorisé', code: 'TIKTOK_ACCOUNT_NOT_FOUND' });
      return;
    }

    if (!tiktokAccount[0].isValid) {
      res.status(400).json({ error: 'Compte TikTok expiré, veuillez vous reconnecter', code: 'TIKTOK_ACCOUNT_EXPIRED' });
      return;
    }

    // Vérifier que la vidéo n'est pas déjà soumise à une autre campagne
    const existingSubmission = await db
      .select()
      .from(campaignSubmissions)
      .where(eq(campaignSubmissions.tiktokVideoId, tiktokVideoId))
      .limit(1);

    if (existingSubmission[0]) {
      res.status(409).json({ error: 'Cette vidéo est déjà soumise à une campagne', code: 'VIDEO_ALREADY_SUBMITTED' });
      return;
    }

    // Créer la soumission
    const [created] = await db
      .insert(campaignSubmissions)
      .values({
        campaignId,
        tiktokAccountId,
        tiktokVideoId,
        coverImageUrl: coverImageUrl || null,
        status: 'pending',
      })
      .returning();

    // Créer l'entrée de stats initiales
    await db.insert(videoStatsCurrent).values({
      submissionId: created.id,
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
    });

    // Notifier la marque propriétaire de la campagne (fire and forget)
    const brand = await db
      .select({ userId: brands.userId })
      .from(brands)
      .where(eq(brands.id, campaign[0].brandId))
      .limit(1);

    const creator = await db
      .select({ firstName: users.firstName, lastName: users.lastName })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (brand[0] && creator[0]) {
      const creatorName = `${creator[0].firstName} ${creator[0].lastName}`;
      notificationService.notify(
        'new_submission',
        brand[0].userId,
        { creatorName, campaignTitle: campaign[0].title },
        { submissionId: created.id, campaignId: campaign[0].id }
      ).catch((error) => {
        console.error('[CreateSubmission] Erreur notification marque:', (error as Error).message);
      });
    }

    // Récupérer les relations
    const [tiktokAccountData] = await db.select().from(tiktokAccounts).where(eq(tiktokAccounts.id, created.tiktokAccountId)).limit(1);
    const [campaignData] = await db.select().from(campaigns).where(eq(campaigns.id, created.campaignId)).limit(1);
    const [brandData] = await db.select().from(brands).where(eq(brands.id, campaignData.brandId)).limit(1);
    const rewardsData = await db.select().from(campaignRewards).where(eq(campaignRewards.campaignId, campaignData.id));

    const response: SubmissionResponse = {
      id: created.id,
      campaignId: created.campaignId,
      tiktokAccountId: created.tiktokAccountId,
      tiktokVideoId: created.tiktokVideoId,
      coverImageUrl: created.coverImageUrl,
      status: created.status,
      submittedAt: created.submittedAt.toISOString(),
      validatedAt: created.validatedAt?.toISOString() ?? null,
      refuseReason: created.refuseReason,
      adsCode: created.adsCode,
      visibleInCommunity: created.visibleInCommunity,
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

    res.status(201).json(response);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message, code: 'INTERNAL_SERVER_ERROR' });
  }
};



