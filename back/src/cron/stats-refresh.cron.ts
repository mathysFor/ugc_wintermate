import cron from 'node-cron';
import { eq } from 'drizzle-orm';
import { db } from '../db/index';
import {
  campaignSubmissions,
  videoStatsCurrent,
  videoStatsHistory,
  tiktokAccounts,
  campaignRewards,
  campaigns,
  users,
} from '../db/schema';
import { notificationService } from '../services/notifications.service';
import { tiktokService } from '../services/tiktok.service';

/**
 * Service de refresh des statistiques TikTok
 * Exécuté toutes les 4 heures via node-cron
 */

/**
 * Rafraîchit le token d'un compte TikTok si nécessaire
 * @returns Le token d'accès valide ou null si échec
 */
async function ensureValidToken(account: {
  id: number;
  userId: number;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}): Promise<string | null> {
  // Vérifier si le token est expiré
  if (!tiktokService.isTokenExpired(account.expiresAt)) {
    return account.accessToken;
  }

  console.log(`[CRON] Token expiré pour le compte ${account.id}, tentative de refresh...`);

  try {
    // Récupérer l'utilisateur pour vérifier new_20
    const [user] = await db.select().from(users).where(eq(users.id, account.userId)).limit(1);

    if (!user) {
      console.error(`[CRON] Utilisateur non trouvé pour le compte TikTok ${account.id}`);
      return null;
    }

    const newTokens = await tiktokService.refreshAccessToken(account.refreshToken, user.new_20);

    // Mettre à jour les tokens en base
    await db
      .update(tiktokAccounts)
      .set({
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
        expiresAt: new Date(Date.now() + newTokens.expiresIn * 1000),
      })
      .where(eq(tiktokAccounts.id, account.id));

    console.log(`[CRON] Token rafraîchi avec succès pour le compte ${account.id}`);
    return newTokens.accessToken;
  } catch (error) {
    console.error(`[CRON] Échec du refresh token pour le compte ${account.id}:`, error);

    // Marquer le compte comme invalide
    await db
      .update(tiktokAccounts)
      .set({ isValid: false })
      .where(eq(tiktokAccounts.id, account.id));

    return null;
  }
}

/**
 * Vérifie si un palier a été atteint et envoie une notification
 */
async function checkMilestones(submissionId: number, oldViews: number, newViews: number): Promise<void> {
  const [submission] = await db
    .select()
    .from(campaignSubmissions)
    .where(eq(campaignSubmissions.id, submissionId))
    .limit(1);

  if (!submission || submission.status !== 'accepted') return;

  // Récupérer les paliers de la campagne
  const rewards = await db
    .select()
    .from(campaignRewards)
    .where(eq(campaignRewards.campaignId, submission.campaignId));

  // Récupérer le créateur
  const [tiktokAccount] = await db
    .select()
    .from(tiktokAccounts)
    .where(eq(tiktokAccounts.id, submission.tiktokAccountId))
    .limit(1);

  if (!tiktokAccount) return;

  // Récupérer la campagne
  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.id, submission.campaignId))
    .limit(1);

  if (!campaign) return;

  // Vérifier chaque palier
  for (const reward of rewards) {
    // Si on vient de dépasser ce palier
    if (oldViews < reward.viewsTarget && newViews >= reward.viewsTarget) {
      console.log(`[CRON] Palier ${reward.viewsTarget} vues atteint pour la soumission ${submissionId}`);
      await notificationService.notify(
        'milestone_reached',
        tiktokAccount.userId,
        {
          campaignTitle: campaign.title,
          views: reward.viewsTarget.toLocaleString(),
          amount: (reward.amountEur / 100).toFixed(2),
        },
        { views: reward.viewsTarget, amount: reward.amountEur }
      );
    }
  }
}

/**
 * Rafraîchit les stats pour toutes les soumissions acceptées
 */
async function refreshAllStats(): Promise<void> {
  console.log('[CRON] Début du refresh des statistiques TikTok...');

  try {
    // Récupérer toutes les soumissions acceptées
    const submissions = await db
      .select()
      .from(campaignSubmissions)
      .where(eq(campaignSubmissions.status, 'accepted'));

    console.log(`[CRON] ${submissions.length} soumissions à mettre à jour`);

    // Grouper les soumissions par compte TikTok pour optimiser les appels API
    const submissionsByAccount = new Map<number, typeof submissions>();

    for (const submission of submissions) {
      const existing = submissionsByAccount.get(submission.tiktokAccountId) || [];
      existing.push(submission);
      submissionsByAccount.set(submission.tiktokAccountId, existing);
    }

    // Traiter chaque compte
    for (const [accountId, accountSubmissions] of submissionsByAccount) {
      try {
        // Récupérer le compte TikTok
        const [tiktokAccount] = await db
          .select()
          .from(tiktokAccounts)
          .where(eq(tiktokAccounts.id, accountId))
          .limit(1);

        if (!tiktokAccount) {
          console.log(`[CRON] Compte TikTok ${accountId} non trouvé`);
          continue;
        }

        if (!tiktokAccount.isValid) {
          console.log(`[CRON] Compte TikTok ${accountId} invalide, ignoré`);
          continue;
        }

        // S'assurer que le token est valide
        const accessToken = await ensureValidToken(tiktokAccount);

        if (!accessToken) {
          console.log(`[CRON] Impossible d'obtenir un token valide pour le compte ${accountId}`);
          continue;
        }

        // Récupérer les IDs des vidéos à mettre à jour
        const videoIds = accountSubmissions.map((s) => s.tiktokVideoId);

        // Récupérer les stats depuis l'API TikTok
        const videoStats = await tiktokService.getVideoStats(accessToken, videoIds);

        // Créer un map pour accès rapide
        const statsMap = new Map(videoStats.map((s) => [s.id, s]));

        // Mettre à jour chaque soumission
        for (const submission of accountSubmissions) {
          const stats = statsMap.get(submission.tiktokVideoId);

          if (!stats) {
            console.log(`[CRON] Stats non trouvées pour la vidéo ${submission.tiktokVideoId}`);
            continue;
          }

          // Récupérer les anciennes stats
          const [currentStats] = await db
            .select()
            .from(videoStatsCurrent)
            .where(eq(videoStatsCurrent.submissionId, submission.id))
            .limit(1);

          const oldViews = currentStats?.views ?? 0;

          // Vérifier les paliers
          await checkMilestones(submission.id, oldViews, stats.views);

          // Sauvegarder l'historique si les stats existent
          if (currentStats) {
            await db.insert(videoStatsHistory).values({
              submissionId: submission.id,
              statsJson: {
                views: currentStats.views,
                likes: currentStats.likes,
                comments: currentStats.comments,
                shares: currentStats.shares,
              },
            });
          }

          // Mettre à jour ou créer les stats actuelles
          if (currentStats) {
            await db
              .update(videoStatsCurrent)
              .set({
                views: stats.views,
                likes: stats.likes,
                comments: stats.comments,
                shares: stats.shares,
                updatedAt: new Date(),
              })
              .where(eq(videoStatsCurrent.submissionId, submission.id));
          } else {
            await db.insert(videoStatsCurrent).values({
              submissionId: submission.id,
              views: stats.views,
              likes: stats.likes,
              comments: stats.comments,
              shares: stats.shares,
            });
          }

          console.log(
            `[CRON] Stats mises à jour pour la soumission ${submission.id}: ${stats.views} vues`
          );
        }
      } catch (error) {
        console.error(`[CRON] Erreur pour le compte ${accountId}:`, error);
      }
    }

    console.log('[CRON] Refresh des statistiques terminé');
  } catch (error) {
    console.error('[CRON] Erreur lors du refresh des statistiques:', error);
  }
}

/**
 * Initialise le cron job pour le refresh des stats
 * Exécution toutes les 4 heures
 */
export function initStatsRefreshCron(): void {
  // Toutes les 4 heures: '0 */4 * * *'
  cron.schedule('0 */4 * * *', async () => {
    await refreshAllStats();
  });

  console.log('[CRON] Stats refresh cron initialisé (toutes les 4 heures)');
}

/**
 * Fonction pour lancer un refresh manuel (utile pour les tests)
 */
export async function manualRefresh(): Promise<void> {
  await refreshAllStats();
}
