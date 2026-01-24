export type NotificationType =
  | 'submission_accepted'
  | 'submission_refused'
  | 'invoice_uploaded'
  | 'invoice_paid'
  | 'milestone_reached'
  | 'campaign_update'
  | 'campaign_published'
  | 'campaign_published_brand'
  | 'new_creator_registered'
  | 'new_creator_tiktok'
  | 'new_submission'
  | 'referral_new_referee'
  | 'referral_commission_earned'
  | 'referral_invoice_uploaded'
  | 'referral_invoice_paid';

export type Notification = {
  id: number;
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
};

export type NotificationResponse = Notification;

export type CreateNotificationInput = {
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
};

export type PaginatedNotificationsResponse = {
  items: Notification[];
  nextCursor: number | null;
  hasMore: boolean;
  unreadCount?: number;
};

