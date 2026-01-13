/**
 * Service Slack - Gestion des notifications pour les marques
 * Utilise le Web API Slack pour envoyer des messages dans des channels
 */

import { WebClient } from '@slack/web-api';
import type { KnownBlock } from '@slack/web-api';
import type { NotificationType } from '@shared/types/notifications';

// ============================================
// CONFIGURATION
// ============================================

/**
 * Récupère les variables d'environnement Slack
 */
function getConfig() {
  const botToken = process.env.SLACK_BOT_TOKEN;
  const defaultChannel = process.env.SLACK_NOTIFICATIONS_CHANNEL;

  if (!botToken) {
    console.warn('[Slack] Variable SLACK_BOT_TOKEN manquante');
    return null;
  }
  if (!defaultChannel) {
    console.warn('[Slack] Variable SLACK_NOTIFICATIONS_CHANNEL manquante');
    return null;
  }

  return { botToken, defaultChannel };
}

/**
 * Crée un client Slack Web API
 */
function createClient(): WebClient | null {
  const config = getConfig();
  if (!config) {
    return null;
  }

  return new WebClient(config.botToken);
}

// ============================================
// TYPES
// ============================================

export type SlackNotificationInput = {
  type: NotificationType;
  title: string;
  message: string;
  brandName?: string;
  data?: Record<string, unknown>;
};

// ============================================
// HELPERS
// ============================================

/**
 * Convertit le type de notification en emoji
 */
function getNotificationEmoji(type: NotificationType): string {
  const emojis: Record<NotificationType, string> = {
    submission_accepted: '✅',
    submission_refused: '❌',
    invoice_uploaded: '📄',
    invoice_paid: '💰',
    milestone_reached: '🎯',
    campaign_update: '📢',
    campaign_published: '🚀',
    campaign_published_brand: '🚀',
    new_creator_registered: '👤',
    new_creator_tiktok: '🎵',
    new_submission: '📹',
    referral_new_referee: '🤝',
    referral_commission_earned: '💸',
    referral_invoice_uploaded: '📑',
    referral_invoice_paid: '✅',
  };
  return emojis[type] || '🔔';
}

/**
 * Convertit le type de notification en couleur pour le bloc Slack
 */
function getNotificationColor(type: NotificationType): string {
  const colors: Record<NotificationType, string> = {
    submission_accepted: '#22c55e', // green
    submission_refused: '#ef4444', // red
    invoice_uploaded: '#3b82f6', // blue
    invoice_paid: '#22c55e', // green
    milestone_reached: '#f59e0b', // amber
    campaign_update: '#8b5cf6', // purple
    campaign_published: '#10b981', // emerald
    campaign_published_brand: '#10b981', // emerald
    new_creator_registered: '#6366f1', // indigo
    new_creator_tiktok: '#ec4899', // pink
    new_submission: '#0ea5e9', // sky
    referral_new_referee: '#f59e0b', // amber
    referral_commission_earned: '#22c55e', // green
    referral_invoice_uploaded: '#3b82f6', // blue
    referral_invoice_paid: '#22c55e', // green
  };
  return colors[type] || '#6b7280';
}

/**
 * Construit les blocs Slack pour une notification
 */
function buildSlackBlocks(notification: SlackNotificationInput): KnownBlock[] {
  const emoji = getNotificationEmoji(notification.type);
  const blocks: KnownBlock[] = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${emoji} *${notification.title}*`,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: notification.message,
      },
    },
  ];

  // Ajouter le contexte si des données supplémentaires sont présentes
  if (notification.brandName || notification.data) {
    const contextElements: Array<{ type: 'mrkdwn'; text: string }> = [];

    if (notification.brandName) {
      contextElements.push({
        type: 'mrkdwn',
        text: `🏢 *Marque:* ${notification.brandName}`,
      });
    }

    if (notification.data?.campaignId) {
      contextElements.push({
        type: 'mrkdwn',
        text: `📋 *Campagne ID:* ${notification.data.campaignId}`,
      });
    }

    if (notification.data?.invoiceId) {
      contextElements.push({
        type: 'mrkdwn',
        text: `📄 *Facture ID:* ${notification.data.invoiceId}`,
      });
    }

    if (contextElements.length > 0) {
      blocks.push({
        type: 'context',
        elements: contextElements,
      });
    }
  }

  // Ajouter un divider à la fin
  blocks.push({
    type: 'divider',
  });

  return blocks;
}

// ============================================
// SERVICE SLACK
// ============================================

class SlackService {
  private client: WebClient | null = null;

  private getClient(): WebClient | null {
    if (!this.client) {
      this.client = createClient();
    }
    return this.client;
  }

  /**
   * Vérifie si le service est configuré
   */
  isConfigured(): boolean {
    return getConfig() !== null;
  }

  /**
   * Envoie une notification dans un channel Slack
   * @param notification Données de la notification
   * @param channel Channel cible (optionnel, utilise le channel par défaut)
   */
  async sendNotification(
    notification: SlackNotificationInput,
    channel?: string
  ): Promise<void> {
    const client = this.getClient();
    const config = getConfig();

    if (!client || !config) {
      console.warn('[Slack] Service non configuré - notification ignorée');
      return;
    }

    const targetChannel = channel || config.defaultChannel;

    try {
      await client.chat.postMessage({
        channel: targetChannel,
        text: `${notification.title}: ${notification.message}`, // Fallback text
        blocks: buildSlackBlocks(notification),
        attachments: [
          {
            color: getNotificationColor(notification.type),
            fallback: notification.message,
          },
        ],
      });
      console.log(`[Slack] Notification "${notification.type}" envoyée dans ${targetChannel}`);
    } catch (error) {
      console.error('[Slack] Erreur envoi notification:', (error as Error).message);
    }
  }

  /**
   * Envoie un message simple dans un channel
   * @param message Message à envoyer
   * @param channel Channel cible (optionnel)
   */
  async sendMessage(message: string, channel?: string): Promise<void> {
    const client = this.getClient();
    const config = getConfig();

    if (!client || !config) {
      console.warn('[Slack] Service non configuré - message ignoré');
      return;
    }

    const targetChannel = channel || config.defaultChannel;

    try {
      await client.chat.postMessage({
        channel: targetChannel,
        text: message,
      });
      console.log(`[Slack] Message envoyé dans ${targetChannel}`);
    } catch (error) {
      console.error('[Slack] Erreur envoi message:', (error as Error).message);
    }
  }
}

export const slackService = new SlackService();

export default slackService;

