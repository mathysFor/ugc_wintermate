import type { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../../db/index';
import { brands } from '../../db/schema';
import { cloudflareR2Service } from '../../services/cloudflare-r2.service';
import type { BrandResponse, BrandSector } from '@shared/types/brands';
import type { AuthUser } from '@shared/types/auth';

/**
 * Types MIME autorisés pour les logos
 */
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

/**
 * Upload le logo d'une marque vers Cloudflare R2
 * @route POST /api/brands/:id/upload-logo
 * @param {File} req.file - Fichier image (multer)
 * @returns {BrandResponse} Marque mise à jour avec la nouvelle URL du logo
 */
export const uploadBrandLogo = async (req: Request, res: Response): Promise<void> => {
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

    // Vérifier qu'un fichier a été uploadé
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: 'Aucun fichier fourni', code: 'NO_FILE' });
      return;
    }

    // Vérifier le type MIME
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      res.status(400).json({
        error: 'Type de fichier non autorisé. Utilisez JPEG, PNG, WebP ou GIF.',
        code: 'INVALID_FILE_TYPE',
      });
      return;
    }

    // Vérifier la taille du fichier
    if (file.size > MAX_FILE_SIZE) {
      res.status(400).json({
        error: 'Fichier trop volumineux. Maximum 5 MB.',
        code: 'FILE_TOO_LARGE',
      });
      return;
    }

    // Supprimer l'ancien logo s'il existe
    if (existingBrand[0].logoUrl) {
      try {
        await cloudflareR2Service.deleteFile(existingBrand[0].logoUrl);
      } catch {
        // Ignorer l'erreur si le fichier n'existe pas
        console.warn('Impossible de supprimer l\'ancien logo:', existingBrand[0].logoUrl);
      }
    }

    // Upload le nouveau logo vers R2
    const logoUrl = await cloudflareR2Service.uploadFile(
      file.buffer,
      file.originalname,
      file.mimetype,
      'brands/logos'
    );

    // Mettre à jour la marque avec la nouvelle URL
    const [updated] = await db
      .update(brands)
      .set({ logoUrl })
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
    console.error('Erreur lors de l\'upload du logo:', error);
    res.status(500).json({ error: (error as Error).message, code: 'INTERNAL_SERVER_ERROR' });
  }
};

