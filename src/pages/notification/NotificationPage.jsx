import { Navigate } from 'react-router-dom';

import { MY_PAGE_TABS, ROUTES } from '@/constants/routes';

/**
 * 설계서 S-09: 알림 전체 목록은 마이페이지 "알림 목록" 탭에 둔다.
 * 기존 경로로 들어오면 그 탭으로 보낸다.
 */
function NotificationPage() {
  return <Navigate to={`${ROUTES.MY_PAGE}?tab=${MY_PAGE_TABS.NOTIFICATION}`} replace />;
}

export default NotificationPage;
