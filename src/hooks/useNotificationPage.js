import { useCallback, useEffect, useState } from 'react';

import * as notificationApi from '@/api/notificationApi';
import { useNotifications } from '@/hooks/useNotifications';
import { getErrorMessage } from '@/utils/getErrorMessage';

/**
 * 마이페이지 알림 탭의 2페이지부터를 불러온다. page는 화면 기준(1부터)이다.
 * 1페이지는 NotificationProvider가 이미 들고 있는 최근 목록을 쓰므로 요청하지 않는다.
 * 읽음·삭제로 알림이 바뀌면(revision) 보고 있던 페이지를 다시 받는다.
 */
export const useNotificationPage = (page) => {
  const { revision } = useNotifications();
  const shouldLoad = page > 1;
  const [reloadToken, setReloadToken] = useState(0);
  const [state, setState] = useState({
    page: null,
    notifications: [],
    isLoading: false,
    errorMessage: '',
  });

  useEffect(() => {
    if (!shouldLoad) {
      return;
    }

    let isActive = true;

    const loadNotificationPage = async () => {
      try {
        const data = await notificationApi.getNotifications({ page: page - 1 });

        if (isActive) {
          setState({ page, notifications: data.content ?? [], isLoading: false, errorMessage: '' });
        }
      } catch (error) {
        if (isActive) {
          setState({
            page,
            notifications: [],
            isLoading: false,
            errorMessage: getErrorMessage(error),
          });
        }
      }
    };

    loadNotificationPage();

    return () => {
      isActive = false;
    };
  }, [page, shouldLoad, revision, reloadToken]);

  const refetch = useCallback(() => {
    setState((previous) => ({ ...previous, isLoading: true, errorMessage: '' }));
    setReloadToken((previous) => previous + 1);
  }, []);

  const isCurrentPage = state.page === page;

  return {
    notifications: isCurrentPage ? state.notifications : [],
    isLoading: shouldLoad && (!isCurrentPage || state.isLoading),
    errorMessage: isCurrentPage ? state.errorMessage : '',
    refetch,
  };
};
