import type { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../../db/index';
import { brands, users } from '../../db/schema';
import type { CreateBrandInput, BrandResponse, BrandSector } from '@shared/types/brands';
import type { AuthUser } from '@shared/types/auth';

/**
 * Crée un profil marque pour l'utilisateur connecté
 * @route POST /api/brands
 * @param {CreateBrandInput} req.body - Données de la marque
 * @returns {BrandResponse} Marque créée
 */
export const createBrand = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as Request & { user?: AuthUser }).user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Non authentifié', code: 'UNAUTHORIZED' });
      return;
    }

    const { name, sector, website, logoUrl }: CreateBrandInput = req.body;

    if (!name || !sector) {
      res.status(400).json({ error: 'Nom et secteur requis', code: 'FIELDS_REQUIRED' });
      return;
    }

    // Vérifier si l'utilisateur est une marque
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    
    if (!user[0]?.isBrand) {
      res.status(403).json({ error: 'Utilisateur non autorisé comme marque', code: 'NOT_A_BRAND' });
      return;
    }

    // Vérifier si un profil marque existe déjà
    const existingBrand = await db.select().from(brands).where(eq(brands.userId, userId)).limit(1);

    if (existingBrand[0]) {
      res.status(409).json({ error: 'Un profil marque existe déjà', code: 'BRAND_EXISTS' });
      return;
    }

    const [created] = await db
      .insert(brands)
      .values({
        userId,
        name,
        sector,
        website: website ?? null,
        logoUrl: logoUrl ?? null,
      })
      .returning();

    const response: BrandResponse = {
      id: created.id,
      userId: created.userId,
      name: created.name,
      sector: created.sector as BrandSector,
      website: created.website,
      logoUrl: created.logoUrl,
      createdAt: created.createdAt.toISOString(),
    };

    res.status(201).json(response);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message, code: 'INTERNAL_SERVER_ERROR' });
  }
};



