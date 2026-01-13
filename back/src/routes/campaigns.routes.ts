import { Router } from 'express';
import { createCampaign, getCampaign, getAllCampaigns, updateCampaign, deleteCampaign } from '../controllers/campaigns';
import { createReward, getRewards, getMyRewardsStatus, deleteReward } from '../controllers/campaign-rewards';
import { createSubmission, getCampaignSubmissions, getPublicCampaignSubmissions } from '../controllers/submissions';
import { getCampaignInvoices } from '../controllers/invoices';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @route GET /api/campaigns
 * @description Liste toutes les campagnes actives (public)
 */
router.get('/', getAllCampaigns);

/**
 * @route POST /api/campaigns
 * @description Crée une nouvelle campagne
 */
router.post('/', authMiddleware, createCampaign);

/**
 * @route GET /api/campaigns/:id
 * @description Récupère une campagne par ID
 */
router.get('/:id', getCampaign);

/**
 * @route POST /api/campaigns/:id/update
 * @description Met à jour une campagne
 */
router.post('/:id/update', authMiddleware, updateCampaign);

/**
 * @route POST /api/campaigns/:id/delete
 * @description Supprime une campagne (soft delete)
 */
router.post('/:id/delete', authMiddleware, deleteCampaign);

// === Rewards (paliers) ===

/**
 * @route GET /api/campaigns/:id/rewards
 * @description Liste les paliers d'une campagne
 */
router.get('/:id/rewards', getRewards);

/**
 * @route POST /api/campaigns/:id/rewards
 * @description Crée un palier pour une campagne
 */
router.post('/:id/rewards', authMiddleware, createReward);

/**
 * @route GET /api/campaigns/:id/my-rewards-status
 * @description Récupère l'état des paliers pour le créateur connecté
 */
router.get('/:id/my-rewards-status', authMiddleware, getMyRewardsStatus);

// === Submissions ===

/**
 * @route POST /api/campaigns/:id/submit
 * @description Soumet une vidéo à une campagne
 */
router.post('/:id/submit', authMiddleware, createSubmission);

/**
 * @route GET /api/campaigns/:id/submissions
 * @description Liste les soumissions d'une campagne (pour la marque)
 */
router.get('/:id/submissions', authMiddleware, getCampaignSubmissions);

/**
 * @route GET /api/campaigns/:id/submissions/public
 * @description Liste les soumissions approuvées d'une campagne (public)
 */
router.get('/:id/submissions/public', getPublicCampaignSubmissions);

// === Invoices ===

/**
 * @route GET /api/campaigns/:id/invoices
 * @description Liste les factures d'une campagne (pour la marque)
 */
router.get('/:id/invoices', authMiddleware, getCampaignInvoices);

export default router;


