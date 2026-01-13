import { Router } from 'express';
import multer from 'multer';
import { createBrand, getBrand, getMyBrand, updateBrand, uploadBrandLogo } from '../controllers/brands';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Configuration multer pour les images de logo
const uploadLogo = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (_req, file, cb) => {
    // Accepter uniquement les images
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers JPEG, PNG, WebP et GIF sont acceptés'));
    }
  },
});

/**
 * @route POST /api/brands
 * @description Crée un profil marque
 */
router.post('/', authMiddleware, createBrand);

/**
 * @route GET /api/brands/me
 * @description Récupère le profil marque de l'utilisateur connecté
 */
router.get('/me', authMiddleware, getMyBrand);

/**
 * @route GET /api/brands/:id
 * @description Récupère un profil marque par ID
 */
router.get('/:id', getBrand);

/**
 * @route POST /api/brands/:id/update
 * @description Met à jour un profil marque
 */
router.post('/:id/update', authMiddleware, updateBrand);

/**
 * @route POST /api/brands/:id/upload-logo
 * @description Upload le logo d'une marque
 */
router.post('/:id/upload-logo', authMiddleware, uploadLogo.single('logo'), uploadBrandLogo);

export default router;



