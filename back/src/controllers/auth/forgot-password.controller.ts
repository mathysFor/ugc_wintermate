import type { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import { db } from '../../db/index';
import { users, passwordResetTokens } from '../../db/schema';
import type { ForgotPasswordInput, ForgotPasswordResponse } from '@shared/types/auth';
import { sendPasswordResetEmail } from '../../services/email.service';

const FRONTEND_URL = process.env.FRONTEND_URL ?? process.env.FRONT_URL ?? 'http://localhost:5173';

/**
 * Demande de réinitialisation de mot de passe par email.
 * Retourne toujours 200 + message générique pour ne pas révéler si l'email existe.
 * @route POST /api/auth/forgot-password
 * @param {ForgotPasswordInput} req.body - Email de l'utilisateur
 * @returns {ForgotPasswordResponse} Message générique
 */
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email }: ForgotPasswordInput = req.body;

    if (!email || typeof email !== 'string' || !email.trim()) {
      res.status(400).json({ error: 'Email requis', code: 'FIELDS_REQUIRED' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);

    const message: ForgotPasswordResponse = {
      message: 'Si cet email est connu, un lien de réinitialisation a été envoyé.',
    };

    if (!user[0]) {
      res.status(200).json(message);
      return;
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 heure

    await db.insert(passwordResetTokens).values({
      userId: user[0].id,
      token,
      expiresAt,
    });

    const resetLink = `${FRONTEND_URL.replace(/\/$/, '')}/reset-password?token=${token}`;

    await sendPasswordResetEmail(normalizedEmail, resetLink);

    res.status(200).json(message);
  } catch (error) {
    console.error('[ForgotPassword] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: errorMessage,
      code: 'INTERNAL_SERVER_ERROR',
      details: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined,
    });
  }
};
