import type { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../../db/index';
import { campaignSubmissions, tiktokAccounts, campaigns, brands } from '../../db/schema';
import type { AuthUser } from '@shared/types/auth';

/**
 * Supprime une soumission
 * - Les créateurs peuvent supprimer uniquement leurs soumissions en attente
 * - Les brands peuvent supprimer toutes les soumissions de leurs campagnes (même acceptées)
 * @route POST /api/submissions/:id/delete
 * @param {string} id - ID de la soumission
 * @returns {object} Message de confirmation
 */
export const deleteSubmission = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as Request & { user?: AuthUser }).user?.id;
    const submissionId = parseInt(req.params.id, 10);

    if (!userId) {
      res.status(401).json({ error: 'Non authentifié', code: 'UNAUTHORIZED' });
      return;
    }

    if (isNaN(submissionId)) {
      res.status(400).json({ error: 'ID de soumission invalide', code: 'INVALID_ID' });
      return;
    }

    // Récupérer la soumission
    const [submission] = await db
      .select()
      .from(campaignSubmissions)
      .where(eq(campaignSubmissions.id, submissionId))
      .limit(1);

    if (!submission) {
      res.status(404).json({ error: 'Soumission non trouvée', code: 'SUBMISSION_NOT_FOUND' });
      return;
    }

    // Vérifier si l'utilisateur est le créateur (propriétaire de la soumission)
    const [tiktokAccount] = await db
      .select()
      .from(tiktokAccounts)
      .where(eq(tiktokAccounts.id, submission.tiktokAccountId))
      .limit(1);

    const isCreator = tiktokAccount !== undefined && tiktokAccount.userId === userId;

    // Vérifier si l'utilisateur est la brand (propriétaire de la campagne)
    const [campaign] = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, submission.campaignId))
      .limit(1);

    let isBrand = false;
    if (campaign) {
      const [brand] = await db
        .select()
        .from(brands)
        .where(eq(brands.id, campaign.brandId))
        .limit(1);
      
      isBrand = brand !== undefined && brand.userId === userId;
    }

    // Vérifier les autorisations
    if (!isCreator && !isBrand) {
      res.status(403).json({ error: 'Non autorisé à supprimer cette soumission', code: 'FORBIDDEN' });
      return;
    }

    // Si c'est un créateur, vérifier que la soumission est en attente
    if (isCreator && !isBrand && submission.status !== 'pending') {
      res.status(400).json({ 
        error: 'Seules les soumissions en attente peuvent être supprimées', 
        code: 'INVALID_STATUS' 
      });
      return;
    }

    // Les brands peuvent supprimer toutes les soumissions (même acceptées)
    // Supprimer la soumission
    await db
      .delete(campaignSubmissions)
      .where(eq(campaignSubmissions.id, submissionId));

    res.json({ success: true, message: 'Soumission supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message, code: 'INTERNAL_SERVER_ERROR' });
  }
};







