import type { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../../db/index';
import { tiktokAccounts } from '../../db/schema';
import type { TiktokAccountsListResponse } from '@shared/types/tiktok';
import type { AuthUser } from '@shared/types/auth';

/**
 * Récupère les comptes TikTok de l'utilisateur connecté
 * @route GET /api/tiktok/accounts
 * @returns {TiktokAccountsListResponse} Liste des comptes TikTok
 */
export const getAccounts = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as Request & { user?: AuthUser }).user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Non authentifié', code: 'UNAUTHORIZED' });
      return;
    }

    const accounts = await db
      .select()
      .from(tiktokAccounts)
      .where(eq(tiktokAccounts.userId, userId));

    const response: TiktokAccountsListResponse = accounts.map((account) => ({
      id: account.id,
      userId: account.userId,
      tiktokUserId: account.tiktokUserId,
      username: account.username,
      isValid: account.isValid,
      expiresAt: account.expiresAt.toISOString(),
      createdAt: account.createdAt.toISOString(),
    }));

    res.json(response);
  } catch (error) {
    console.error('[GetAccounts] Erreur:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId: (req as Request & { user?: AuthUser }).user?.id,
    });
    res.status(500).json({ error: (error as Error).message, code: 'INTERNAL_SERVER_ERROR' });
  }
};









