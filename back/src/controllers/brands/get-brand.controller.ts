import type { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../../db/index';
import { brands } from '../../db/schema';
import type { BrandResponse, BrandSector } from '@shared/types/brands';
import type { AuthUser } from '@shared/types/auth';

/**
 * Récupère un profil marque par ID
 * @route GET /api/brands/:id
 * @param {number} id - ID de la marque
 * @returns {BrandResponse} Marque trouvée
 */
export const getBrand = async (req: Request, res: Response): Promise<void> => {
  try {
    const brandId = parseInt(req.params.id, 10);

    if (isNaN(brandId)) {
      res.status(400).json({ error: 'ID invalide', code: 'INVALID_ID' });
      return;
    }

    const brand = await db.select().from(brands).where(eq(brands.id, brandId)).limit(1);

    if (!brand[0]) {
      res.status(404).json({ error: 'Marque non trouvée', code: 'BRAND_NOT_FOUND' });
      return;
    }

    const response: BrandResponse = {
      id: brand[0].id,
      userId: brand[0].userId,
      name: brand[0].name,
      sector: brand[0].sector as BrandSector,
      website: brand[0].website,
      logoUrl: brand[0].logoUrl,
      createdAt: brand[0].createdAt.toISOString(),
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message, code: 'INTERNAL_SERVER_ERROR' });
  }
};

/**
 * Récupère le profil marque de l'utilisateur connecté
 * @route GET /api/brands/me
 * @returns {BrandResponse} Marque de l'utilisateur
 */
export const getMyBrand = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as Request & { user?: AuthUser }).user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Non authentifié', code: 'UNAUTHORIZED' });
      return;
    }

    const brand = await db.select().from(brands).where(eq(brands.userId, userId)).limit(1);

    if (!brand[0]) {
      res.json(null);
      return;
    }

    const response: BrandResponse = {
      id: brand[0].id,
      userId: brand[0].userId,
      name: brand[0].name,
      sector: brand[0].sector as BrandSector,
      website: brand[0].website,
      logoUrl: brand[0].logoUrl,
      createdAt: brand[0].createdAt.toISOString(),
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message, code: 'INTERNAL_SERVER_ERROR' });
  }
};

