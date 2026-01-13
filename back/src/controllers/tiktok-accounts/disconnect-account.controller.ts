import type { Request, Response } from 'express';
import { eq, and } from 'drizzle-orm';
import { db } from '../../db/index';
import { tiktokAccounts } from '../../db/schema';
import type { AuthUser } from '@shared/types/auth';

/**
 * Déconnecte un compte TikTok
 * @route POST /api/tiktok/accounts/:id/disconnect
 * @returns {object} Message de confirmation
 */
export const disconnectAccount = async (req: Request, res: Response): Promise<void> => {
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

    // Vérifier que le compte appartient à l'utilisateur
    const account = await db
      .select()
      .from(tiktokAccounts)
      .where(and(eq(tiktokAccounts.id, accountId), eq(tiktokAccounts.userId, userId)))
      .limit(1);

    if (!account[0]) {
      res.status(404).json({ error: 'Compte TikTok non trouvé', code: 'ACCOUNT_NOT_FOUND' });
      return;
    }

    // Marquer le compte comme invalide plutôt que de le supprimer
    // pour conserver l'historique des soumissions
    await db
      .update(tiktokAccounts)
      .set({ isValid: false })
      .where(eq(tiktokAccounts.id, accountId));

    res.json({ message: 'Compte TikTok déconnecté avec succès' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message, code: 'INTERNAL_SERVER_ERROR' });
  }
};









