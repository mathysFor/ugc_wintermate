import { useAuthStore } from '@/stores/auth';
import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { AppRoutes, ProtectedRoutes } from '@/navigation/use-app-routes';
import { useMatchRoutes } from '@/hooks/use-match-routes';

interface AuthLayoutProps {
  children: ReactNode;
}

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const location = useLocation();
  
  const isProtected = useMatchRoutes(Object.values(ProtectedRoutes));
  const isAuthRoute = useMatchRoutes([AppRoutes.login, AppRoutes.register]);

  // Non connecté sur route protégée → login
  if (isProtected && !isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Connecté sur page login/register → dashboard
  if (isAuthRoute && isAuthenticated) {
    const redirectTo = user?.isBrand ? '/dashboard/brand' : '/dashboard/creator';
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}; 