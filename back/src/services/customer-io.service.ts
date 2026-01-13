/**
 * Service Customer.io - Gestion des événements CRM pour les créateurs
 * Utilise la Track API pour envoyer des events et identifier les utilisateurs
 */

import { TrackClient, RegionUS } from 'customerio-node';

// ============================================
// CONFIGURATION
// ============================================

/**
 * Récupère les variables d'environnement Customer.io
 */
function getConfig() {
  const siteId = process.env.CUSTOMERIO_SITE_ID;
  const apiKey = process.env.CUSTOMERIO_API_KEY;

  if (!siteId || !apiKey) {
    return null;
  }

  return { siteId, apiKey };
}

/**
 * Crée un client Customer.io Track API
 */
function createClient(): TrackClient | null {
  const config = getConfig();
  if (!config) {
    return null;
  }

  return new TrackClient(config.siteId, config.apiKey, { region: RegionUS });
}

// ============================================
// TYPES
// ============================================

export type CustomerIoUserTraits = {
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  is_creator: boolean;
  is_brand: boolean;
  created_at?: number;
};

export type CustomerIoEventProperties = {
  notification_type: string;
  title: string;
  message: string;
  [key: string]: unknown;
};

// ============================================
// SERVICE CUSTOMER.IO
// ============================================

class CustomerIoService {
  private client: TrackClient | null = null;

  private getClient(): TrackClient | null {
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
   * Identifie un utilisateur dans Customer.io
   * Crée ou met à jour le profil utilisateur
   * @param userId ID de l'utilisateur
   * @param traits Attributs de l'utilisateur
   */
  async identify(userId: number, traits: CustomerIoUserTraits): Promise<void> {
    const client = this.getClient();
    if (!client) {
      console.warn('[CustomerIO] Service non configuré - identify ignoré');
      return;
    }

    try {
      await client.identify(String(userId), {
        email: traits.email,
        first_name: traits.first_name,
        last_name: traits.last_name,
        phone: traits.phone,
        is_creator: traits.is_creator,
        is_brand: traits.is_brand,
        created_at: traits.created_at ?? Math.floor(Date.now() / 1000),
      });
      console.log(`[CustomerIO] Utilisateur ${userId} identifié`);
    } catch (error) {
      console.error('[CustomerIO] Erreur identify:', (error as Error).message);
    }
  }

  /**
   * Envoie un événement pour un utilisateur
   * @param userId ID de l'utilisateur
   * @param eventName Nom de l'événement
   * @param properties Propriétés de l'événement
   */
  async track(
    userId: number,
    eventName: string,
    properties: CustomerIoEventProperties
  ): Promise<void> {
    const client = this.getClient();
    if (!client) {
      console.warn('[CustomerIO] Service non configuré - track ignoré');
      return;
    }

    try {
      await client.track(String(userId), {
        name: eventName,
        data: properties,
      });
      console.log(`[CustomerIO] Event "${eventName}" envoyé pour utilisateur ${userId}`);
    } catch (error) {
      console.error('[CustomerIO] Erreur track:', (error as Error).message);
    }
  }

  /**
   * Envoie une notification en tant qu'événement Customer.io
   * Méthode utilitaire pour les notifications créateurs
   */
  async sendNotificationEvent(
    userId: number,
    notificationType: string,
    title: string,
    message: string,
    data?: Record<string, unknown>
  ): Promise<void> {
    await this.track(userId, `notification_${notificationType}`, {
      notification_type: notificationType,
      title,
      message,
      ...data,
    });
  }
}

export const customerIoService = new CustomerIoService();

export default customerIoService;

