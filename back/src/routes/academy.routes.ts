import { Router } from 'express';

const router = Router();

/**
 * @route GET /api/academy
 * @description Placeholder for academy routes
 */
router.get('/', (_req, res) => {
  res.json({ message: 'Academy API' });
});

export default router;
