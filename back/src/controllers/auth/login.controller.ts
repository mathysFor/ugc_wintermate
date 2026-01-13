import type { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../../db/index';
import { users } from '../../db/schema';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import type { LoginInput, AuthResponse, AuthUser } from '@shared/types/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

/**
 * Authentifie un utilisateur et retourne un JWT
 * @route POST /api/auth/login
 * @param {LoginInput} req.body - Identifiants de connexion
 * @returns {AuthResponse} Token JWT et utilisateur
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password }: LoginInput = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email et mot de passe requis', code: 'FIELDS_REQUIRED' });
      return;
    }

    const user = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (!user[0]) {
      res.status(401).json({ error: 'Utilisateur non trouvé', code: 'USER_NOT_FOUND' });
      return;
    }

    const valid = await bcrypt.compare(password, user[0].hashedPassword);

    if (!valid) {
      res.status(401).json({ error: 'Mot de passe invalide', code: 'INVALID_PASSWORD' });
      return;
    }

    const payload: AuthUser = {
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
      createdAt: user[0].createdAt.toISOString(),
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
    const response: AuthResponse = { token, user: payload };

    res.json(response);
  } catch (error) {
    console.error('[Login] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      error: errorMessage, 
      code: 'INTERNAL_SERVER_ERROR',
      details: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
    });
  }
};



