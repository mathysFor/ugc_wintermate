import { eq, and, isNull } from 'drizzle-orm';
import { db } from '../db/index';
import { notifications, users, brands } from '../db/schema';
import type { CreateNotificationInput, Notification, NotificationType } from '@shared/types/notifications';
import { customerIoService } from './customer-io.service';
import { slackService } from './slack.service';
import { getExternalChannel, buildNotificationMessage } from '../config/notifications.config';

// ============================================
// SERVICE DE NOTIFICATIONS
// ============================================

/**
 * Service de gestion des notifications in-app
 * Avec intégration Customer.io (créateurs) et Slack (marques)
 * 
 * Configuration centralisée dans : config/notifications.config.ts
 * 
 * Usage unique : notificationService.notify(type, userId, variables, data)
 */
class NotificationService {
  /**
   * Crée une notification en utilisant la configuration centralisée
   * C'est le SEUL point d'entrée pour créer des notifications
   * 
   * @param type Type de notification (défini dans notifications.config.ts)
   * @param userId ID de l'utilisateur destinataire
   * @param variables Variables pour le template du message
   * @param data Données additionnelles stockées avec la notification
   * 
   * @example
   * await notificationService.notify(
   *   'submission_accepted',
   *   userId,
   *   { campaignTitle: 'Ma campagne' },
   *   { submissionId: 123, campaignId: 456 }
   * );
   */
  async notify(
    type: NotificationType,
    userId: number,
    variables: Record<string, string | number>,
    data?: Record<string, unknown>
  ): Promise<Notification> {
    const { title, message } = buildNotificationMessage(type, variables);
    return this.create({
      userId,
      type,
      title,
      message,
      data,
    });
  }

  /**
   * Crée une notification en base et envoie les notifications externes
   * Méthode interne - préférer notify() pour les appels externes
   */
  private async create(input: CreateNotificationInput): Promise<Notification> {
    // 1. Créer la notification en base de données
    const [created] = await db
      .insert(notifications)
      .values({
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        data: input.data ?? null,
      })
      .returning();

    const notification: Notification = {
      id: created.id,
      userId: created.userId,
      type: created.type,
      title: created.title,
      message: created.message,
      data: created.data as Record<string, unknown> | null,
      readAt: created.readAt?.toISOString() ?? null,
      createdAt: created.createdAt.toISOString(),
    };

    // 2. Envoyer les notifications externes (fire and forget)
    this.sendExternalNotification(input).catch((error) => {
      console.error('[Notifications] Erreur notification externe:', (error as Error).message);
    });

    return notification;
  }

  /**
   * Envoie une notification externe selon le type d'utilisateur
   * Fire and forget - les erreurs sont loggées mais n'impactent pas la notification in-app
   */
  private async sendExternalNotification(input: CreateNotificationInput): Promise<void> {
    const channel = getExternalChannel(input.type);
    
    if (channel === 'none') {
      return;
    }

    // Récupérer les informations de l'utilisateur
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        isCreator: users.isCreator,
        isBrand: users.isBrand,
      })
      .from(users)
      .where(eq(users.id, input.userId))
      .limit(1);

    if (!user) {
      console.warn(`[Notifications] Utilisateur ${input.userId} non trouvé pour notification externe`);
      return;
    }

    // Notification pour créateur -> Customer.io
    if (channel === 'customer_io' && user.isCreator) {
      await customerIoService.sendNotificationEvent(
        input.userId,
        input.type,
        input.title,
        input.message,
        input.data
      );
    }

    // Notification pour marque -> Slack
    if (channel === 'slack' && user.isBrand) {
      // Récupérer le nom de la marque pour enrichir le message Slack
      const [brand] = await db
        .select({ name: brands.name })
        .from(brands)
        .where(eq(brands.userId, user.id))
        .limit(1);

      await slackService.sendNotification({
        type: input.type,
        title: input.title,
        message: input.message,
        brandName: brand?.name,
        data: input.data,
      });
    }
  }

  /**
   * Récupère le nombre de notifications non lues
   */
  async getUnreadCount(userId: number): Promise<number> {
    const unread = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));

    return unread.length;
  }

  /**
   * Marque une notification comme lue
   */
  async markAsRead(notificationId: number, userId: number): Promise<Notification | null> {
    const [notification] = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)))
      .limit(1);

    if (!notification) {
      return null;
    }

    const [updated] = await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(eq(notifications.id, notificationId))
      .returning();

    return {
      id: updated.id,
      userId: updated.userId,
      type: updated.type,
      title: updated.title,
      message: updated.message,
      data: updated.data as Record<string, unknown> | null,
      readAt: updated.readAt?.toISOString() ?? null,
      createdAt: updated.createdAt.toISOString(),
    };
  }

  /**
   * Marque toutes les notifications d'un utilisateur comme lues
   */
  async markAllAsRead(userId: number): Promise<number> {
    const result = await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)))
      .returning();

    return result.length;
  }
}

export const notificationService = new NotificationService();
