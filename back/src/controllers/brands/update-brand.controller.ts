import type { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../../db/index';
import { brands } from '../../db/schema';
import type { UpdateBrandInput, BrandResponse, BrandSector } from '@shared/types/brands';
import type { AuthUser } from '@shared/types/auth';

/**
 * Met à jour le profil marque de l'utilisateur connecté
 * @route POST /api/brands/:id/update
 * @param {UpdateBrandInput} req.body - Données à mettre à jour
 * @returns {BrandResponse} Marque mise à jour
 */
export const updateBrand = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as Request & { user?: AuthUser }).user?.id;
    const brandId = parseInt(req.params.id, 10);

    if (!userId) {
      res.status(401).json({ error: 'Non authentifié', code: 'UNAUTHORIZED' });
      return;
    }

    if (isNaN(brandId)) {
      res.status(400).json({ error: 'ID invalide', code: 'INVALID_ID' });
      return;
    }

    // Vérifier que la marque appartient à l'utilisateur
    const existingBrand = await db.select().from(brands).where(eq(brands.id, brandId)).limit(1);

    if (!existingBrand[0]) {
      res.status(404).json({ error: 'Marque non trouvée', code: 'BRAND_NOT_FOUND' });
      return;
    }

    if (existingBrand[0].userId !== userId) {
      res.status(403).json({ error: 'Non autorisé à modifier cette marque', code: 'FORBIDDEN' });
      return;
    }

    const { name, sector, website, logoUrl }: UpdateBrandInput = req.body;

    const updateData: Partial<typeof brands.$inferInsert> = {};
    if (name !== undefined) updateData.name = name;
    if (sector !== undefined) updateData.sector = sector;
    if (website !== undefined) updateData.website = website;
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl;

    if (Object.keys(updateData).length === 0) {
      res.status(400).json({ error: 'Aucune donnée à mettre à jour', code: 'NO_DATA' });
      return;
    }

    const [updated] = await db
      .update(brands)
      .set(updateData)
      .where(eq(brands.id, brandId))
      .returning();

    const response: BrandResponse = {
      id: updated.id,
      userId: updated.userId,
      name: updated.name,
      sector: updated.sector as BrandSector,
      website: updated.website,
      logoUrl: updated.logoUrl,
      createdAt: updated.createdAt.toISOString(),
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message, code: 'INTERNAL_SERVER_ERROR' });
  }
};









