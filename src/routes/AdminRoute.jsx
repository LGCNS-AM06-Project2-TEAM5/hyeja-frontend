import { Navigate, Outlet } from 'react-router-dom';

import LoadingSpinner from '@/components/common/LoadingSpinner';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/hooks/useAuth';

const ADMIN_ROLE = 'ADMIN';

function AdminRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (user?.role !== ADMIN_ROLE) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  return <Outlet />;
}

export default AdminRoute;
