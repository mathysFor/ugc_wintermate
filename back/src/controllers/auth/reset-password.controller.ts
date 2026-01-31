import type { Request, Response } from 'express';
import { eq, and, gt } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { db } from '../../db/index';
import { users, passwordResetTokens } from '../../db/schema';
import type { ResetPasswordInput, ResetPasswordResponse } from '@shared/types/auth';

/**
 * Réinitialisation du mot de passe avec un token valide.
 * @route POST /api/auth/reset-password
 * @param {ResetPasswordInput} req.body - Token et nouveau mot de passe
 * @returns {ResetPasswordResponse} Message de succès
 */
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, newPassword }: ResetPasswordInput = req.body;

    if (!token || !newPassword || typeof token !== 'string' || typeof newPassword !== 'string') {
      res.status(400).json({ error: 'Token et nouveau mot de passe requis', code: 'FIELDS_REQUIRED' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères', code: 'INVALID_PASSWORD' });
      return;
    }

    const now = new Date();
    const rows = await db
      .select()
      .from(passwordResetTokens)
      .where(and(eq(passwordResetTokens.token, token), gt(passwordResetTokens.expiresAt, now)))
      .limit(1);

    if (!rows[0]) {
      res.status(400).json({
        error: 'Lien invalide ou expiré. Veuillez demander un nouveau lien.',
        code: 'INVALID_OR_EXPIRED_TOKEN',
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.update(users).set({ hashedPassword }).where(eq(users.id, rows[0].userId));

    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, rows[0].userId));

    const response: ResetPasswordResponse = { message: 'Mot de passe mis à jour.' };
    res.status(200).json(response);
  } catch (error) {
    console.error('[ResetPassword] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: errorMessage,
      code: 'INTERNAL_SERVER_ERROR',
      details: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined,
    });
  }
};
