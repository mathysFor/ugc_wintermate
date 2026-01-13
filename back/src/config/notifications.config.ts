/**
 * Configuration centralisée des notifications
 * 
 * Pour ajouter une nouvelle notification :
 * 1. Ajouter le type dans NOTIFICATION_TYPES
 * 2. Ajouter la configuration dans NOTIFICATION_CONFIG
 * 3. Ajouter le type dans shared/types/notifications.d.ts
 * 4. Ajouter le type dans back/src/db/schema.ts (notificationTypeEnum)
 * 5. (Optionnel) Ajouter une méthode utilitaire dans notifications.service.ts
 */

import type { NotificationType } from '@shared/types/notifications';

// ============================================
// TYPES
// ============================================

/**
 * Destinataire de la notification
 */
export type NotificationTarget = 'creator' | 'brand';

/**
 * Canal externe de notification
 */
export type NotificationChannel = 'customer_io' | 'slack' | 'none';

/**
 * Configuration d'une notification
 */
export type NotificationConfigItem = {
  /** Type de notification */
  type: NotificationType;
  /** Titre par défaut */
  defaultTitle: string;
  /** Template du message (utilise {variable} pour les placeholders) */
  messageTemplate: string;
  /** Destinataire principal */
  target: NotificationTarget;
  /** Canal externe */
  externalChannel: NotificationChannel;
  /** Description pour la documentation */
  description: string;
};

// ============================================
// LISTE DES TYPES DE NOTIFICATIONS
// ============================================

/**
 * Liste de tous les types de notifications disponibles
 * Utiliser cette liste comme référence unique
 */
export const NOTIFICATION_TYPES = [
  'submission_accepted',
  'submission_refused',
  'invoice_uploaded',
  'invoice_paid',
  'milestone_reached',
  'campaign_update',
  'campaign_published',
  'campaign_published_brand',
  'new_creator_registered',
  'new_creator_tiktok',
  'new_submission',
  'referral_new_referee',
  'referral_commission_earned',
  'referral_invoice_uploaded',
  'referral_invoice_paid',
] as const;

// ============================================
// CONFIGURATION DES NOTIFICATIONS
// ============================================

/**
 * Configuration centralisée de toutes les notifications
 * Modifier ici pour changer les messages, titres, etc.
 */
export const NOTIFICATION_CONFIG: Record<NotificationType, NotificationConfigItem> = {
  // === NOTIFICATIONS CRÉATEURS ===
  
  submission_accepted: {
    type: 'submission_accepted',
    defaultTitle: 'Soumission acceptée',
    messageTemplate: 'Votre vidéo a été acceptée pour la campagne "{campaignTitle}"',
    target: 'creator',
    externalChannel: 'customer_io',
    description: 'Envoyée au créateur quand sa vidéo est validée par la marque',
  },

  submission_refused: {
    type: 'submission_refused',
    defaultTitle: 'Soumission refusée',
    messageTemplate: 'Votre vidéo a été refusée pour la campagne "{campaignTitle}"{reason}',
    target: 'creator',
    externalChannel: 'customer_io',
    description: 'Envoyée au créateur quand sa vidéo est refusée par la marque',
  },

  invoice_paid: {
    type: 'invoice_paid',
    defaultTitle: 'Facture payée',
    messageTemplate: 'Votre facture de {amount}€ pour la campagne "{campaignTitle}" a été marquée comme payée',
    target: 'creator',
    externalChannel: 'customer_io',
    description: 'Envoyée au créateur quand sa facture est marquée comme payée',
  },

  milestone_reached: {
    type: 'milestone_reached',
    defaultTitle: 'Palier atteint !',
    messageTemplate: 'Félicitations ! Vous avez atteint {views} vues sur la campagne "{campaignTitle}". Vous pouvez déposer votre facture de {amount}€.',
    target: 'creator',
    externalChannel: 'customer_io',
    description: 'Envoyée au créateur quand il atteint un palier de vues',
  },

  // === NOTIFICATIONS MARQUES ===

  invoice_uploaded: {
    type: 'invoice_uploaded',
    defaultTitle: 'Nouvelle facture reçue',
    messageTemplate: '{creatorName} a déposé une facture pour la campagne "{campaignTitle}"',
    target: 'brand',
    externalChannel: 'slack',
    description: 'Envoyée à la marque quand un créateur dépose une facture',
  },

  campaign_update: {
    type: 'campaign_update',
    defaultTitle: 'Mise à jour campagne',
    messageTemplate: 'La campagne "{campaignTitle}" a été mise à jour',
    target: 'brand',
    externalChannel: 'slack',
    description: 'Envoyée à la marque pour les mises à jour de campagne',
  },

  campaign_published: {
    type: 'campaign_published',
    defaultTitle: 'Nouvelle campagne disponible !',
    messageTemplate: 'Une nouvelle campagne "{campaignTitle}" de {brandName} est disponible. Participez dès maintenant !',
    target: 'creator',
    externalChannel: 'customer_io',
    description: 'Envoyée à tous les créateurs quand une campagne est publiée',
  },

  campaign_published_brand: {
    type: 'campaign_published_brand',
    defaultTitle: 'Campagne publiée',
    messageTemplate: 'Votre campagne "{campaignTitle}" est maintenant en ligne et visible par les créateurs',
    target: 'brand',
    externalChannel: 'slack',
    description: 'Confirmation à la marque quand sa campagne est publiée',
  },

  new_creator_registered: {
    type: 'new_creator_registered',
    defaultTitle: 'Nouveau créateur inscrit',
    messageTemplate: 'Un nouveau créateur {creatorName} ({email} - {phone}) vient de s\'inscrire sur la plateforme',
    target: 'brand',
    externalChannel: 'slack',
    description: 'Envoyée à toutes les marques quand un créateur s\'inscrit',
  },

  new_creator_tiktok: {
    type: 'new_creator_tiktok',
    defaultTitle: 'Compte TikTok connecté',
    messageTemplate: '{creatorName} a connecté son compte TikTok @{tiktokUsername}',
    target: 'brand',
    externalChannel: 'slack',
    description: 'Envoyée à toutes les marques quand un créateur connecte son compte TikTok',
  },

  new_submission: {
    type: 'new_submission',
    defaultTitle: 'Nouvelle soumission à valider',
    messageTemplate: '{creatorName} a soumis une vidéo pour la campagne "{campaignTitle}"',
    target: 'brand',
    externalChannel: 'slack',
    description: 'Envoyée à la marque quand un créateur soumet une vidéo',
  },

  // === NOTIFICATIONS PARRAINAGE ===

  referral_new_referee: {
    type: 'referral_new_referee',
    defaultTitle: 'Nouveau filleul !',
    messageTemplate: '{refereeName} s\'est inscrit grâce à votre lien de parrainage',
    target: 'creator',
    externalChannel: 'customer_io',
    description: 'Envoyée au parrain quand un filleul s\'inscrit',
  },

  referral_commission_earned: {
    type: 'referral_commission_earned',
    defaultTitle: 'Commission gagnée !',
    messageTemplate: 'Vous avez gagné {amount}€ de commission grâce à {refereeName}',
    target: 'creator',
    externalChannel: 'customer_io',
    description: 'Envoyée au parrain quand il gagne une commission',
  },

  referral_invoice_uploaded: {
    type: 'referral_invoice_uploaded',
    defaultTitle: 'Facture de parrainage reçue',
    messageTemplate: '{creatorName} a déposé une facture de parrainage de {amount}€',
    target: 'brand',
    externalChannel: 'slack',
    description: 'Alerte Slack quand une facture de parrainage est uploadée',
  },

  referral_invoice_paid: {
    type: 'referral_invoice_paid',
    defaultTitle: 'Facture de parrainage payée',
    messageTemplate: 'Votre facture de parrainage de {amount}€ a été payée',
    target: 'creator',
    externalChannel: 'customer_io',
    description: 'Envoyée au parrain quand sa facture de parrainage est payée',
  },
};

// ============================================
// HELPERS
// ============================================

/**
 * Récupère la configuration d'une notification
 */
export function getNotificationConfig(type: NotificationType): NotificationConfigItem {
  return NOTIFICATION_CONFIG[type];
}

/**
 * Vérifie si une notification est destinée à un créateur
 */
export function isCreatorNotification(type: NotificationType): boolean {
  return NOTIFICATION_CONFIG[type].target === 'creator';
}

/**
 * Vérifie si une notification est destinée à une marque
 */
export function isBrandNotification(type: NotificationType): boolean {
  return NOTIFICATION_CONFIG[type].target === 'brand';
}

/**
 * Récupère le canal externe d'une notification
 */
export function getExternalChannel(type: NotificationType): NotificationChannel {
  return NOTIFICATION_CONFIG[type].externalChannel;
}

/**
 * Remplace les placeholders dans un template
 * @example formatMessage("Bonjour {name}", { name: "Jean" }) => "Bonjour Jean"
 */
export function formatMessage(template: string, variables: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const value = variables[key];
    return value !== undefined ? String(value) : match;
  });
}

/**
 * Génère le message complet d'une notification
 */
export function buildNotificationMessage(
  type: NotificationType,
  variables: Record<string, string | number>
): { title: string; message: string } {
  const config = getNotificationConfig(type);
  return {
    title: config.defaultTitle,
    message: formatMessage(config.messageTemplate, variables),
  };
}

// ============================================
// LISTE DES NOTIFICATIONS PAR CIBLE
// ============================================

/**
 * Notifications destinées aux créateurs
 */
export const CREATOR_NOTIFICATIONS = Object.values(NOTIFICATION_CONFIG)
  .filter((n) => n.target === 'creator')
  .map((n) => n.type);

/**
 * Notifications destinées aux marques
 */
export const BRAND_NOTIFICATIONS = Object.values(NOTIFICATION_CONFIG)
  .filter((n) => n.target === 'brand')
  .map((n) => n.type);

