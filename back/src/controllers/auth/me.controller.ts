import type { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../../db/index';
import { users } from '../../db/schema';
import type { AuthUser } from '@shared/types/auth';

/**
 * Récupère les informations de l'utilisateur connecté
 * @route GET /api/auth/me
 * @returns {AuthUser} Utilisateur authentifié
 */
export const me = async (req: Request, res: Response): Promise<void> => {
  try {
    // L'utilisateur est ajouté par le middleware d'authentification
    const userId = (req as Request & { user?: AuthUser }).user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Non authentifié', code: 'UNAUTHORIZED' });
      return;
    }

    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (!user[0]) {
      res.status(404).json({ error: 'Utilisateur non trouvé', code: 'USER_NOT_FOUND' });
      return;
    }

    const response: AuthUser = {
      id: user[0].id,
      email: user[0].email,
      firstName: user[0].firstName,
      lastName: user[0].lastName,
      phone: user[0].phone ?? null,
      isCreator: user[0].isCreator,
      isBrand: user[0].isBrand,
      referralCode: user[0].referralCode ?? null,
      referralPercentage: user[0].referralPercentage ?? 10,
      referredById: user[0].referredById ?? null,
      new_20: user[0].new_20,
      createdAt: user[0].createdAt.toISOString(),
      appsflyerLink: user[0].appsflyerLink ?? null,
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message, code: 'INTERNAL_SERVER_ERROR' });
  }
};









