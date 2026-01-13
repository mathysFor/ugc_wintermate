import type { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../../db/index';
import { tiktokAccounts, users, brands } from '../../db/schema';
import { tiktokService } from '../../services/tiktok.service';
import type { ConnectTiktokResponse, TiktokCallbackInput } from '@shared/types/tiktok';
import type { AuthUser } from '@shared/types/auth';
import { notificationService } from '../../services/notifications.service';

/**
 * Traite le callback OAuth TikTok avec PKCE
 * Échange le code contre des tokens et sauvegarde le compte
 * @route POST /api/tiktok/callback
 * @param {TiktokCallbackInput} req.body - Code OAuth, state et codeVerifier PKCE
 * @returns {ConnectTiktokResponse} Compte TikTok connecté
 */
export const callback = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as Request & { user?: AuthUser }).user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Non authentifié', code: 'UNAUTHORIZED' });
      return;
    }

    const { code, state, codeVerifier } = req.body as TiktokCallbackInput;

    if (!code) {
      res.status(400).json({ error: 'Code OAuth manquant', code: 'MISSING_CODE' });
      return;
    }

    if (!state) {
      res.status(400).json({ error: 'State CSRF manquant', code: 'MISSING_STATE' });
      return;
    }

    if (!codeVerifier) {
      res.status(400).json({ error: 'Code verifier PKCE manquant', code: 'MISSING_CODE_VERIFIER' });
      return;
    }

    // Vérifier que l'utilisateur est un créateur
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (!user[0]?.isCreator) {
      res.status(403).json({ error: 'Réservé aux créateurs', code: 'NOT_A_CREATOR' });
      return;
    }

    // 1. Échanger le code contre des tokens (avec PKCE)
    const tokens = await tiktokService.exchangeCodeForTokens(code, codeVerifier);

    // 2. Récupérer les informations utilisateur TikTok
    // L'openId est récupéré depuis le token car non dispo via user/info sans user.info.basic
    const userInfo = await tiktokService.getUserInfo(tokens.accessToken, tokens.openId);

    // 3. Vérifier si le compte TikTok existe déjà
    const existingAccount = await db
      .select()
      .from(tiktokAccounts)
      .where(eq(tiktokAccounts.tiktokUserId, tokens.openId))
      .limit(1);

    // Calculer la date d'expiration
    const expiresAt = new Date(Date.now() + tokens.expiresIn * 1000);

    if (existingAccount[0]) {
      // Le compte existe - vérifier s'il appartient à cet utilisateur
      if (existingAccount[0].userId !== userId) {
        res.status(409).json({
          error: 'Ce compte TikTok est déjà connecté à un autre utilisateur',
          code: 'ACCOUNT_ALREADY_CONNECTED',
        });
        return;
      }

      // Mettre à jour le compte existant
      const [updated] = await db
        .update(tiktokAccounts)
        .set({
          username: userInfo.username,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt,
          isValid: true,
        })
        .where(eq(tiktokAccounts.id, existingAccount[0].id))
        .returning();

      const response: ConnectTiktokResponse = {
        account: {
          id: updated.id,
          userId: updated.userId,
          tiktokUserId: updated.tiktokUserId,
          username: updated.username,
          isValid: updated.isValid,
          expiresAt: updated.expiresAt.toISOString(),
          createdAt: updated.createdAt.toISOString(),
        },
        message: 'Compte TikTok connecté avec succès',
      };

      res.json(response);
      return;
    }

    // 4. Créer un nouveau compte TikTok
    const [created] = await db
      .insert(tiktokAccounts)
      .values({
        userId,
        tiktokUserId: tokens.openId,
        username: userInfo.username,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt,
        isValid: true,
      })
      .returning();

    // 5. Notifier toutes les marques de la connexion TikTok (fire and forget)
    const creatorName = `${user[0].firstName} ${user[0].lastName}`;
    const allBrands = await db
      .select({ userId: brands.userId })
      .from(brands);

    for (const brand of allBrands) {
      notificationService.notify(
        'new_creator_tiktok',
        brand.userId,
        { creatorName, tiktokUsername: userInfo.username },
        { tiktokAccountId: created.id, creatorUserId: userId }
      ).catch((error) => {
        console.error('[TikTokCallback] Erreur notification marque:', (error as Error).message);
      });
    }

    const response: ConnectTiktokResponse = {
      account: {
        id: created.id,
        userId: created.userId,
        tiktokUserId: created.tiktokUserId,
        username: created.username,
        isValid: created.isValid,
        expiresAt: created.expiresAt.toISOString(),
        createdAt: created.createdAt.toISOString(),
      },
      message: 'Compte TikTok connecté avec succès',
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Erreur callback TikTok:', error);
    res.status(500).json({ error: (error as Error).message, code: 'TIKTOK_OAUTH_ERROR' });
  }
};

