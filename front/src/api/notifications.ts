import { useFetcher, useMutator } from "@/api/api";
import type {
  NotificationResponse,
  PaginatedNotificationsResponse,
} from "@shared/types/notifications";

export const useGetNotifications = (
  params?: { cursor?: string; limit?: number; unreadOnly?: string },
  options = {}
) =>
  useFetcher<typeof params, PaginatedNotificationsResponse>({
    key: ["notifications", params],
    path: "/api/notifications",
    params,
    options,
  });

export const useMarkNotificationRead = (notificationId: number, options = {}) =>
  useMutator<undefined, NotificationResponse>(
    `/api/notifications/${notificationId}/read`,
    options
  );

export const useMarkAllNotificationsRead = (options = {}) =>
  useMutator<undefined, { message: string; count: number }>(
    "/api/notifications/read-all",
    options
  );









