import { Router } from 'express';
import multer from 'multer';
import { uploadInvoice, getInvoices, getBrandInvoices, markPaid } from '../controllers/invoices';
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
 * @route POST /api/invoices
 * @description Upload une facture (fichier PDF)
 */
router.post('/', authMiddleware, upload.single('file'), uploadInvoice);

/**
 * @route GET /api/invoices/brand
 * @description Liste les factures des campagnes de la marque
 */
router.get('/brand', authMiddleware, getBrandInvoices);

/**
 * @route GET /api/invoices
 * @description Liste les factures de l'utilisateur (créateur)
 */
router.get('/', authMiddleware, getInvoices);

/**
 * @route POST /api/invoices/:id/mark-paid
 * @description Marque une facture comme payée
 */
router.post('/:id/mark-paid', authMiddleware, markPaid);

export default router;
