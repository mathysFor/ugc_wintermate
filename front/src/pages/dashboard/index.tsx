import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';

/**
 * Page dashboard - redirige vers le bon dashboard selon le rôle
 */
export const DashboardPage = () => {
  const user = useAuthStore((s) => s.user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si l'utilisateur est marque, rediriger vers le dashboard marque
  if (user.isBrand) {
    return <Navigate to="/dashboard/brand" replace />;
  }

  // Si l'utilisateur est créateur, rediriger vers le dashboard créateur
  if (user.isCreator) {
    return <Navigate to="/dashboard/creator" replace />;
  }

  // Par défaut, rediriger vers les campagnes
  return <Navigate to="/campaigns" replace />;
};









