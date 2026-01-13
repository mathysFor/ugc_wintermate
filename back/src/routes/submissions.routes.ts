import { Router } from 'express';
import { getSubmissions, validateSubmission, refuseSubmission, deleteSubmission, getBrandSubmissions, refreshStats } from '../controllers/submissions';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @route GET /api/submissions
 * @description Liste les soumissions de l'utilisateur (créateur)
 */
router.get('/', authMiddleware, getSubmissions);

/**
 * @route GET /api/submissions/brand
 * @description Liste les soumissions de toutes les campagnes d'une marque
 */
router.get('/brand', authMiddleware, getBrandSubmissions);

/**
 * @route POST /api/submissions/:id/validate
 * @description Valide (accepte) une soumission
 */
router.post('/:id/validate', authMiddleware, validateSubmission);

/**
 * @route POST /api/submissions/:id/refuse
 * @description Refuse une soumission
 */
router.post('/:id/refuse', authMiddleware, refuseSubmission);

/**
 * @route POST /api/submissions/:id/delete
 * @description Supprime une soumission en attente (créateur uniquement)
 */
router.post('/:id/delete', authMiddleware, deleteSubmission);

/**
 * @route POST /api/submissions/refresh-stats
 * @description Déclenche un refresh manuel des statistiques TikTok (marques uniquement)
 */
router.post('/refresh-stats', authMiddleware, refreshStats);

export default router;


