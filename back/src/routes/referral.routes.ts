import { Router } from 'express';
import multer from 'multer';
import {
  getReferralDashboard,
  getReferees,
  getCommissions,
  uploadReferralInvoice,
  getReferralInvoices,
  getAllReferralInvoices,
  markReferralInvoicePaid,
} from '../controllers/referral';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Configuration multer pour stocker les fichiers en mémoire
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (_req, file, cb) => {
    // Accepter uniquement les fichiers PDF
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers PDF sont acceptés'));
    }
  },
});

/**
 * @route GET /api/referral/dashboard
 * @description Récupère le dashboard de parrainage du créateur connecté
 */
router.get('/dashboard', authMiddleware, getReferralDashboard);

/**
 * @route GET /api/referral/referees
 * @description Liste les filleuls du créateur connecté
 */
router.get('/referees', authMiddleware, getReferees);

/**
 * @route GET /api/referral/commissions
 * @description Liste les commissions de parrainage du créateur connecté
 */
router.get('/commissions', authMiddleware, getCommissions);

/**
 * @route GET /api/referral/invoices
 * @description Liste les factures de parrainage du créateur connecté
 */
router.get('/invoices', authMiddleware, getReferralInvoices);

/**
 * @route GET /api/referral/invoices/all
 * @description Liste toutes les factures de parrainage (marques uniquement)
 */
router.get('/invoices/all', authMiddleware, getAllReferralInvoices);

/**
 * @route POST /api/referral/invoices
 * @description Upload une facture pour retirer les commissions de parrainage
 */
router.post('/invoices', authMiddleware, upload.single('file'), uploadReferralInvoice);

/**
 * @route POST /api/referral/invoices/:id/mark-paid
 * @description Marque une facture de parrainage comme payée (marques uniquement)
 */
router.post('/invoices/:id/mark-paid', authMiddleware, markReferralInvoicePaid);

export default router;

