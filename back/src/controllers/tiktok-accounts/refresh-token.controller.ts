import type { Request, Response } from 'express';
import { eq, and } from 'drizzle-orm';
import { db } from '../../db/index';
import { tiktokAccounts } from '../../db/schema';
import { tiktokService } from '../../services/tiktok.service';
import type { TiktokRefreshTokenResponse } from '@shared/types/tiktok';
import type { AuthUser } from '@shared/types/auth';

/**
 * Force le refresh du token d'un compte TikTok
 * @route POST /api/tiktok/accounts/:id/refresh
 * @returns {TiktokRefreshTokenResponse} Statut du refresh
 */
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as Request & { user?: AuthUser }).user?.id;
    const accountId = parseInt(req.params.id, 10);

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

    try {
      // Rafraîchir le token
      const newTokens = await tiktokService.refreshAccessToken(account.refreshToken);

      const expiresAt = new Date(Date.now() + newTokens.expiresIn * 1000);

      // Mettre à jour en base
      await db
        .update(tiktokAccounts)
        .set({
          accessToken: newTokens.accessToken,
          refreshToken: newTokens.refreshToken,
          expiresAt,
          isValid: true,
        })
        .where(eq(tiktokAccounts.id, accountId));

      const [updatedAccount] = await db
        .select()
        .from(tiktokAccounts)
        .where(eq(tiktokAccounts.id, accountId))
        .limit(1);

      const response: TiktokRefreshTokenResponse = {
        success: true,
        account: {
          id: updatedAccount.id,
          userId: updatedAccount.userId,
          tiktokUserId: updatedAccount.tiktokUserId,
          username: updatedAccount.username,
          isValid: updatedAccount.isValid,
          expiresAt: updatedAccount.expiresAt.toISOString(),
          createdAt: updatedAccount.createdAt.toISOString(),
        },
        message: 'Token rafraîchi avec succès',
      };

      res.json(response);
    } catch (refreshError) {
      // Le refresh a échoué - marquer le compte comme invalide
      await db
        .update(tiktokAccounts)
        .set({ isValid: false })
        .where(eq(tiktokAccounts.id, accountId));

      res.status(401).json({
        error: 'Impossible de rafraîchir le token. Veuillez vous reconnecter.',
        code: 'TOKEN_REFRESH_FAILED',
        success: false,
      });
    }
  } catch (error) {
    res.status(500).json({ error: (error as Error).message, code: 'INTERNAL_SERVER_ERROR' });
  }
};









