import { Router } from 'express';
import { login, register, me } from '../controllers/auth';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @route POST /api/auth/login
 * @description Authentifie un utilisateur
 */
router.post('/login', login);

/**
 * @route POST /api/auth/register
 * @description Crée un nouvel utilisateur
 */
router.post('/register', register);

/**
 * @route GET /api/auth/me
 * @description Récupère l'utilisateur connecté
 */
router.get('/me', authMiddleware, me);

export default router;
