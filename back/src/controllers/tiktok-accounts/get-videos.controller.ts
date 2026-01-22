import type { Request, Response } from 'express';
import { eq, and } from 'drizzle-orm';
import { db } from '../../db/index';
import { tiktokAccounts, users } from '../../db/schema';
import { tiktokService } from '../../services/tiktok.service';
import type { TiktokVideosListResponse } from '@shared/types/tiktok';
import type { AuthUser } from '@shared/types/auth';

/**
 * Récupère les vidéos d'un compte TikTok
 * @route GET /api/tiktok/accounts/:id/videos
 * @param {string} cursor - Cursor pour la pagination (optionnel)
 * @returns {TiktokVideosListResponse} Liste des vidéos avec pagination
 */
export const getVideos = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as Request & { user?: AuthUser }).user?.id;
    const accountId = parseInt(req.params.id, 10);
    const cursor = req.query.cursor ? Number(req.query.cursor) : undefined;

    if (!userId) {
      res.status(401).json({ error: 'Non authentifié', code: 'UNAUTHORIZED' });
      return;
    }

    if (isNaN(accountId)) {
      res.status(400).json({ error: 'ID invalide', code: 'INVALID_ID' });
      return;
    }

    // Récupérer le compte TikTok
    const [account] = await db
      .select()
      .from(tiktokAccounts)
      .where(and(eq(tiktokAccounts.id, accountId), eq(tiktokAccounts.userId, userId)))
      .limit(1);

    if (!account) {
      res.status(404).json({ error: 'Compte TikTok non trouvé', code: 'ACCOUNT_NOT_FOUND' });
      return;
    }

    if (!account.isValid) {
      res.status(400).json({
        error: 'Compte TikTok déconnecté. Veuillez vous reconnecter.',
        code: 'ACCOUNT_INVALID',
      });
      return;
    }

    // Récupérer l'utilisateur pour vérifier new_20
    const [user] = await db.select().from(users).where(eq(users.id, account.userId)).limit(1);

    if (!user) {
      res.status(404).json({ error: 'Utilisateur non trouvé', code: 'USER_NOT_FOUND' });
      return;
    }

    // Vérifier si le token doit être rafraîchi
    let accessToken = account.accessToken;

    if (tiktokService.isTokenExpired(account.expiresAt)) {
      try {
        const newTokens = await tiktokService.refreshAccessToken(account.refreshToken, user.new_20);

        // Mettre à jour les tokens en base
        await db
          .update(tiktokAccounts)
          .set({
            accessToken: newTokens.accessToken,
            refreshToken: newTokens.refreshToken,
            expiresAt: new Date(Date.now() + newTokens.expiresIn * 1000),
          })
          .where(eq(tiktokAccounts.id, accountId));

        accessToken = newTokens.accessToken;
      } catch (refreshError) {
        // Le refresh a échoué - marquer le compte comme invalide
        await db
          .update(tiktokAccounts)
          .set({ isValid: false })
          .where(eq(tiktokAccounts.id, accountId));

        res.status(401).json({
          error: 'Session TikTok expirée. Veuillez vous reconnecter.',
          code: 'TOKEN_REFRESH_FAILED',
        });
        return;
      }
    }

    // Récupérer les vidéos depuis l'API TikTok
    console.log(`[TikTok Videos] Fetching videos for account ${accountId} (user: ${account.username})`);
    const videosData = await tiktokService.getUserVideos(accessToken, cursor);
    console.log(`[TikTok Videos] Found ${videosData.videos.length} videos, hasMore: ${videosData.hasMore}`);

    const response: TiktokVideosListResponse = {
      videos: videosData.videos.map((video) => ({
        id: video.id,
        videoId: video.id,
        title: video.title,
        description: video.description,
        coverImageUrl: video.coverImageUrl,
        shareUrl: video.shareUrl,
        embedLink: video.embedLink,
        duration: video.duration,
        createTime: new Date(video.createdAt).getTime() / 1000,
        createdAt: video.createdAt,
      })),
      nextCursor: videosData.cursor ? String(videosData.cursor) : null,
      hasMore: videosData.hasMore,
    };

    res.json(response);
  } catch (error) {
    console.error('Erreur récupération vidéos TikTok:', error);
    res.status(500).json({ error: (error as Error).message, code: 'INTERNAL_SERVER_ERROR' });
  }
};


