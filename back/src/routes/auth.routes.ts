import { Router } from 'express';
import { login, register, me, forgotPassword, resetPassword } from '../controllers/auth';
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
 * @route POST /api/auth/forgot-password
 * @description Demande de réinitialisation de mot de passe par email
 */
router.post('/forgot-password', forgotPassword);

/**
 * @route POST /api/auth/reset-password
 * @description Réinitialisation du mot de passe avec un token
 */
router.post('/reset-password', resetPassword);

/**
 * @route GET /api/auth/me
 * @description Récupère l'utilisateur connecté
 */
router.get('/me', authMiddleware, me);

export default router;
