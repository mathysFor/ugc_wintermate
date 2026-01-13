import { useGetNotifications, useMarkAllNotificationsRead } from '@/api/notifications';
import { queryClient } from '@/api/query-config';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  CheckCircle2, 
  XCircle, 
  FileText, 
  DollarSign, 
  PartyPopper, 
  Megaphone, 
  Bell, 
  Check,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import type { Notification } from '@shared/types/notifications';

export const NotificationsPage = () => {
  const { data: notifications, isLoading } = useGetNotifications();
  const { mutateAsync: markAllRead, isPending: markingAll } = useMarkAllNotificationsRead({
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
  const user = useAuthStore((state) => state.user);
  const isBrand = user?.isBrand;

  const handleMarkRead = async (e: React.MouseEvent, notificationId: number) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await fetch(`/api/notifications/${notificationId}/read`, { 
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        }
      });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch (err) {
      console.error(err);
    }
  };

  const getNotificationLink = (notification: Notification): string | null => {
    const data = notification.data as Record<string, number | string | undefined> | null;
    
    switch (notification.type) {
      case 'submission_accepted':
      case 'submission_refused':
        if (data?.campaignId) {
          return `/campaign/${data.campaignId}`;
        }
        return isBrand ? '/brand/submissions' : '/submissions';
      case 'invoice_uploaded':
      case 'invoice_paid':
        return isBrand ? '/brand/invoices' : '/invoices';
      case 'milestone_reached':
        return '/submissions';
      case 'campaign_update':
        if (data?.campaignId) {
          return `/campaign/${data.campaignId}`;
        }
        return isBrand ? '/brand/campaigns' : '/campaigns';
      default:
        return null;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'submission_accepted':
        return <CheckCircle2 className="text-green-500" size={16} />;
      case 'submission_refused':
        return <XCircle className="text-red-500" size={16} />;
      case 'invoice_uploaded':
        return <FileText className="text-[#ED5D3B]" size={16} />;
      case 'invoice_paid':
        return <DollarSign className="text-green-600" size={16} />;
      case 'milestone_reached':
        return <PartyPopper className="text-amber-500" size={16} />;
      case 'campaign_update':
        return <Megaphone className="text-purple-500" size={16} />;
      default:
        return <Bell className="text-slate-400" size={16} />;
    }
  };

  return (
    <div className="w-full space-y-4 pb-20 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xl font-bold text-slate-900">Notifications</p>
          <p className="text-sm text-slate-500">
            {notifications?.unreadCount || 0} non lue(s)
          </p>
        </div>
        {notifications && (notifications.unreadCount ?? 0) > 0 && (
          <Button
            variant="outline"
            onClick={() => markAllRead(undefined)}
            disabled={markingAll}
            className="rounded-full"
            size="sm"
          >
            <Check className="mr-1.5" size={14} />
            {markingAll ? '...' : 'Tout marquer comme lu'}
          </Button>
        )}
      </div>

      <div className="space-y-1.5">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))
        ) : notifications?.items.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-200">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <Bell className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-sm font-semibold text-slate-900">C'est calme par ici</p>
            <p className="text-xs text-slate-500">Aucune notification pour le moment.</p>
          </div>
        ) : (
          notifications?.items.map((notification) => {
            const link = getNotificationLink(notification);
            const content = (
              <>
                <div className={cn(
                  "p-2 rounded-full flex-shrink-0 h-8 w-8 flex items-center justify-center",
                  !notification.readAt ? "bg-white shadow-sm" : "bg-slate-50"
                )}>
                  {getNotificationIcon(notification.type)}
                </div>
                
                <div className="flex-1 min-w-0 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={cn(
                        "text-sm font-medium truncate",
                        !notification.readAt ? "text-slate-900" : "text-slate-600"
                      )}>
                        {notification.title}
                      </p>
                      <span className="text-xs text-slate-400 flex-shrink-0">
                        {new Date(notification.createdAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate">
                      {notification.message}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {link && (
                      <ExternalLink size={14} className="text-slate-400" />
                    )}
                    {!notification.readAt && (
                      <button
                        onClick={(e) => handleMarkRead(e, notification.id)}
                        className="text-[#0EA5E9] hover:bg-sky-100 p-1.5 rounded-full transition-colors"
                        title="Marquer comme lu"
                      >
                        <div className="w-2 h-2 bg-[#0EA5E9] rounded-full" />
                      </button>
                    )}
                  </div>
                </div>
              </>
            );

            const className = cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all duration-150 hover:shadow-sm",
              !notification.readAt 
                ? "bg-sky-50/60 border-sky-100" 
                : "bg-white border-slate-100 hover:border-slate-200",
              link && "cursor-pointer"
            );

            return link ? (
              <Link 
                key={notification.id}
                to={link}
                className={className}
              >
                {content}
              </Link>
            ) : (
              <div 
                key={notification.id}
                className={className}
              >
                {content}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
