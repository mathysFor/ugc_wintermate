import type { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../../db/index';
import { users } from '../../db/schema';
import { tiktokService } from '../../services/tiktok.service';
import type { TiktokAuthUrlResponse } from '@shared/types/tiktok';
import type { AuthUser } from '@shared/types/auth';

/**
 * Génère l'URL d'autorisation OAuth TikTok avec PKCE
 * @route GET /api/tiktok/auth-url
 * @returns {TiktokAuthUrlResponse} URL d'autorisation, state CSRF et codeVerifier PKCE
 */
export const getAuthUrl = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as Request & { user?: AuthUser }).user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Non authentifié', code: 'UNAUTHORIZED' });
      return;
    }

    // Récupérer l'utilisateur pour vérifier new_20
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (!user) {
      res.status(404).json({ error: 'Utilisateur non trouvé', code: 'USER_NOT_FOUND' });
      return;
    }

    const { authUrl, state, codeVerifier } = await tiktokService.generateAuthUrl(user.new_20);

    // Le frontend stockera state et codeVerifier en sessionStorage
    const response: TiktokAuthUrlResponse = {
      authUrl,
      state,
      codeVerifier,
    };

    res.json(response);
  } catch (error) {
    console.error('[GetAuthUrl] Erreur:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId: (req as Request & { user?: AuthUser }).user?.id,
    });
    res.status(500).json({ error: (error as Error).message, code: 'INTERNAL_SERVER_ERROR' });
  }
};
