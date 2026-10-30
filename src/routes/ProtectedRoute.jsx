import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

import LoadingSpinner from '@/components/common/LoadingSpinner';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/hooks/useAuth';
import { useLoginDialog } from '@/hooks/useLoginDialog';

function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const { requireLogin } = useLoginDialog();
  const shouldRequestLogin = !isLoading && !isAuthenticated;

  useEffect(() => {
    if (shouldRequestLogin) {
      requireLogin();
    }
  }, [shouldRequestLogin, requireLogin]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
