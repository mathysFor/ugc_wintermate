import { useState, useEffect, type ReactNode } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import { useGetNotifications } from '@/api/notifications';
import { useGetBrandSubmissions } from '@/api/submissions';
import { useGetBrandInvoices } from '@/api/invoices';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { BricksCreatorsLogo } from '@/components/bricks-creators-logo';
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Settings,
  LogOut,
  Megaphone,
  Bell,
  Video,
  Menu,
  X,
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const MainLayout = ({ children }: { children?: ReactNode }) => {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);
  const location = useLocation();
  
  // État pour la sidebar mobile
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const isBrand = user?.isBrand;

  // Fermer la sidebar automatiquement lors d'un changement de route
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const { data: notifications } = useGetNotifications(undefined, {
    enabled: isAuthenticated,
  });
  const unreadCount = notifications?.unreadCount || 0;

  // Compteurs pour les marques (soumissions en attente et factures à payer)
  const { data: brandSubmissions } = useGetBrandSubmissions(undefined, {
    enabled: isAuthenticated && !!isBrand,
  });
  const pendingSubmissionsCount = brandSubmissions?.pendingCount || 0;

  const { data: brandInvoices } = useGetBrandInvoices(undefined, {
    enabled: isAuthenticated && !!isBrand,
  });
  const pendingInvoicesCount = brandInvoices?.pendingCount || 0;

  // La landing page doit toujours être affichée sans layout, même si l'utilisateur est connecté
  const isLandingPage = location.pathname === '/';

  // Si non authentifié OU si c'est la landing page, afficher le contenu sans sidebar
  if (!isAuthenticated || isLandingPage) {
    return <>{children || <Outlet />}</>;
  }

  const navigation = [
    {
      name: 'Dashboard',
      href: isBrand ? '/dashboard/brand' : '/dashboard/creator',
      icon: LayoutDashboard,
      show: true
    },
    {
      name: 'Campagnes',
      href: isBrand ? '/brand/campaigns' : '/campaigns',
      icon: Megaphone,
      show: true
    },
    {
      name: 'Créateurs',
      href: '/brand/creators',
      icon: Users,
      show: !!isBrand
    },
    {
      name: 'Soumissions',
      href: isBrand ? '/brand/submissions' : '/submissions',
      icon: FileText,
      show: true
    },
    {
      name: 'Vidéos',
      href: '/brand/videos',
      icon: Video,
      show: !!isBrand
    },
    {
      name: 'Factures',
      href: isBrand ? '/brand/invoices' : '/invoices',
      icon: Briefcase,
      show: true
    },
    {
      name: 'Parrainage',
      href: '/referral',
      icon: Users,
      show: !isBrand
    },
    {
      name: 'Notifications',
      href: '/notifications',
      icon: Bell,
      show: true
    },
    {
      name: 'Profil',
      href: '/profile',
      icon: Settings,
      show: true
    }
  ];

  return (
    <div className="h-screen w-full bg-slate-50 flex flex-col lg:flex-row overflow-hidden">
      {/* Mobile Header */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:hidden flex-shrink-0">
        <Link to="/dashboard" className="flex items-center">
          <BricksCreatorsLogo className="h-8 w-auto" />
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(true)}
          className="text-slate-600"
        >
          <Menu size={24} />
        </Button>
      </header>

      {/* Backdrop overlay pour mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out",
          "lg:relative lg:translate-x-0 lg:flex-shrink-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-full flex flex-col">
          {/* Logo - visible sur desktop, bouton fermer sur mobile */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
            <Link to="/dashboard" className="flex items-center">
              <BricksCreatorsLogo className="h-8 w-auto" />
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-slate-600"
            >
              <X size={20} />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.filter(item => item.show).map((item) => {
              const isActive = location.pathname.startsWith(item.href);
              
              // Déterminer le badge à afficher selon l'item
              let badgeCount = 0;
              if (item.name === 'Notifications') {
                badgeCount = unreadCount;
              } else if (isBrand && item.name === 'Soumissions') {
                badgeCount = pendingSubmissionsCount;
              } else if (isBrand && item.name === 'Factures') {
                badgeCount = pendingInvoicesCount;
              }

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sky-50 text-[#0EA5E9]"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <item.icon size={20} />
                  <span className="flex-1">{item.name}</span>
                  {badgeCount > 0 && (
                    <span className="bg-[#0EA5E9] text-white text-xs font-semibold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                      {badgeCount > 99 ? '99+' : badgeCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User & Logout */}
          <div className="p-4 border-t border-slate-100">
            <div className="flex items-center gap-3 mb-4 px-2">
              <Avatar src={null} fallback={user?.firstName?.[0]} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-slate-500 truncate capitalize">
                  {isBrand ? 'Marque' : 'Créateur'}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={logout}
            >
              <LogOut size={18} className="mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {/* Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-8">
          <div className="w-full animate-fade-in">
            {children || <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
};
