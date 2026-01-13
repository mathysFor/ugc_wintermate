import { Router } from 'express';
import {
  getAuthUrl,
  callback,
  getAccounts,
  getVideos,
  disconnectAccount,
  refreshToken,
} from '../controllers/tiktok-accounts';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// ============================================
// ROUTES OAUTH
// ============================================

/**
 * @route GET /api/tiktok/auth-url
 * @description Génère l'URL d'autorisation OAuth TikTok
 * @returns {TiktokAuthUrlResponse} URL d'autorisation + state CSRF
 */
router.get('/auth-url', authMiddleware, getAuthUrl);

/**
 * @route POST /api/tiktok/callback
 * @description Traite le callback OAuth TikTok (échange code contre tokens)
 * @body {TiktokCallbackInput} code et state
 * @returns {ConnectTiktokResponse} Compte TikTok connecté
 */
router.post('/callback', authMiddleware, callback);

// ============================================
// ROUTES COMPTES
// ============================================

/**
 * @route GET /api/tiktok/accounts
 * @description Liste les comptes TikTok de l'utilisateur
 * @returns {TiktokAccountsListResponse} Liste des comptes
 */
router.get('/accounts', authMiddleware, getAccounts);

/**
 * @route POST /api/tiktok/accounts/:id/disconnect
 * @description Déconnecte un compte TikTok (soft delete)
 * @returns {object} Message de confirmation
 */
router.post('/accounts/:id/disconnect', authMiddleware, disconnectAccount);

/**
 * @route POST /api/tiktok/accounts/:id/refresh
 * @description Force le refresh du token d'un compte TikTok
 * @returns {TiktokRefreshTokenResponse} Statut du refresh
 */
router.post('/accounts/:id/refresh', authMiddleware, refreshToken);

// ============================================
// ROUTES VIDÉOS
// ============================================

/**
 * @route GET /api/tiktok/accounts/:id/videos
 * @description Récupère les vidéos d'un compte TikTok
 * @query {string} cursor - Cursor pour pagination
 * @returns {TiktokVideosListResponse} Liste des vidéos paginée
 */
router.get('/accounts/:id/videos', authMiddleware, getVideos);

export default router;
