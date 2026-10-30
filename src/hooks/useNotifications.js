import { useContext } from 'react';

import { NotificationContext } from '@/contexts/NotificationContext';

export const useNotifications = () => {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error('useNotifications는 NotificationProvider 안에서만 사용할 수 있습니다.');
  }

  return context;
};
