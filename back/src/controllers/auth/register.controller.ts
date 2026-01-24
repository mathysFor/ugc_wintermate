import type { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../../db/index';
import { users, brands } from '../../db/schema';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import type { CreateAccountInput, CreateAccountResponse, AuthUser } from '@shared/types/auth';
import { customerIoService } from '../../services/customer-io.service';
import { notificationService } from '../../services/notifications.service';
import { appsflyerService } from '../../services/appsflyer.service';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

/**
 * Génère un code de parrainage unique de 6 caractères alphanumériques
 */
const generateReferralCode = async (): Promise<string> => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Vérifier que le code n'existe pas déjà
    const existing = await db.select().from(users).where(eq(users.referralCode, code)).limit(1);
    if (!existing[0]) {
      return code;
    }
    attempts++;
  }

  // Fallback avec timestamp si trop de collisions
  return Date.now().toString(36).toUpperCase().slice(-6);
};

/**
 * Crée un nouvel utilisateur
 * @route POST /api/auth/register
 * @param {CreateAccountInput} req.body - Données de création
 * @returns {CreateAccountResponse} Utilisateur créé avec token
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName, phone, referralCode }: CreateAccountInput = req.body;

    if (!email || !password || !firstName || !lastName || !phone) {
      res.status(400).json({ error: 'Tous les champs obligatoires sont requis', code: 'FIELDS_REQUIRED' });
      return;
    }

    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (existing[0]) {
      res.status(409).json({ error: 'Email déjà utilisé', code: 'EMAIL_EXISTS' });
      return;
    }

    // Rechercher le parrain par code (silencieusement si invalide)
    let referrerId: number | null = null;
    if (referralCode) {
      const referrer = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.referralCode, referralCode.toUpperCase()))
        .limit(1);
      
      if (referrer[0]) {
        referrerId = referrer[0].id;
      }
      // Si code invalide, on continue silencieusement (pas d'erreur)
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Générer un code de parrainage unique pour le nouvel utilisateur
    const newReferralCode = await generateReferralCode();

    // Générer le lien AppsFlyer si c'est un créateur
    let appsflyerLink: string | null = null;
    if (req.body.isCreator !== false) { // Par défaut isCreator est true si non spécifié ou true
       appsflyerLink = await appsflyerService.generateOneLink(newReferralCode);
    }

    const [created] = await db
      .insert(users)
      .values({
        email,
        hashedPassword,
        firstName,
        lastName,
        phone,
        isCreator: true,
        isBrand: false,
        referralCode: newReferralCode,
        referredById: referrerId,
        new_20: true,
        appsflyerLink,
      })
      .returning();

    const user: AuthUser = {
      id: created.id,
      email: created.email,
      firstName: created.firstName,
      lastName: created.lastName,
      phone: created.phone ?? null,
      isCreator: created.isCreator,
      isBrand: created.isBrand,
      referralCode: created.referralCode ?? null,
      referralPercentage: created.referralPercentage ?? 10,
      referredById: created.referredById ?? null,
      new_20: created.new_20,
      createdAt: created.createdAt.toISOString(),
      appsflyerLink: created.appsflyerLink ?? null,
    };

    // Identifier le créateur dans Customer.io (fire and forget)
    if (created.isCreator) {
      customerIoService.identify(created.id, {
        email: created.email,
        first_name: created.firstName,
        last_name: created.lastName,
        phone: created.phone ?? undefined,
        is_creator: created.isCreator,
        is_brand: created.isBrand,
        created_at: Math.floor(created.createdAt.getTime() / 1000),
      }).catch((error) => {
        console.error('[Register] Erreur identification Customer.io:', (error as Error).message);
      });

      // Notifier toutes les marques du nouveau créateur inscrit (fire and forget)
      const creatorName = `${created.firstName} ${created.lastName}`;
      const allBrands = await db
        .select({ userId: brands.userId })
        .from(brands);

      for (const brand of allBrands) {
        notificationService.notify(
          'new_creator_registered',
          brand.userId,
          { creatorName, email: created.email, phone: created.phone ?? 'Non renseigné' },
          { creatorUserId: created.id }
        ).catch((error) => {
          console.error('[Register] Erreur notification marque:', (error as Error).message);
        });
      }

      // Notifier le parrain si le créateur a été parrainé (fire and forget)
      if (referrerId) {
        notificationService.notify(
          'referral_new_referee',
          referrerId,
          { refereeName: creatorName },
          { refereeId: created.id }
        ).catch((error) => {
          console.error('[Register] Erreur notification parrain:', (error as Error).message);
        });
      }
    }

    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
    const response: CreateAccountResponse = { user, token };

    res.status(201).json(response);
  } catch (error) {
    console.error('[Register] Erreur:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      body: req.body,
      email: req.body?.email,
    });
    res.status(500).json({ error: (error as Error).message, code: 'INTERNAL_SERVER_ERROR' });
  }
};



