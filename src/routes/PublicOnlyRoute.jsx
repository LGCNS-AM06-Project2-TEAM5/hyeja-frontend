import { Navigate, Outlet } from 'react-router-dom';

import LoadingSpinner from '@/components/common/LoadingSpinner';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/hooks/useAuth';

function PublicOnlyRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  // 회원가입 때 조건까지 함께 저장하므로, 로그인한 회원은 조건 등록 여부와 관계없이 홈으로 보낸다.
  if (isAuthenticated) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  return <Outlet />;
}

export default PublicOnlyRoute;
