import { useCallback, useEffect, useMemo, useState } from 'react';

import * as notificationApi from '@/api/notificationApi';
import { TOAST_MESSAGES } from '@/constants/messages';
import { NotificationContext } from '@/contexts/NotificationContext';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { getErrorMessage } from '@/utils/getErrorMessage';

/**
 * 헤더 알림창과 마이페이지 알림 탭이 같은 알림을 본다.
 * 화면마다 따로 조회하면 같은 요청이 여러 번 나가므로, 로그인한 동안 이곳에서 한 번만 불러온다.
 * 목록은 최근 한 페이지(8건)만 들고, 안 읽은 개수는 서버가 전체 알림 기준으로 준 값을 쓴다.
 */
function NotificationProvider({ children }) {
  const { isAuthenticated, user } = useAuth();
  const memberId = user?.id;
  const { showSuccess, showError } = useToast();
  const [reloadToken, setReloadToken] = useState(0);
  const [state, setState] = useState({
    memberId: null,
    notifications: [],
    unreadCount: 0,
    totalPages: 0,
    isLoading: isAuthenticated,
    errorMessage: '',
  });

  useEffect(() => {
    if (!isAuthenticated || memberId == null) {
      return;
    }

    let isActive = true;

    const loadNotifications = async () => {
      try {
        const data = await notificationApi.getNotifications();

        if (isActive) {
          setState({
            memberId,
            notifications: data.content ?? [],
            unreadCount: data.unreadCount ?? 0,
            totalPages: data.totalPages ?? 0,
            isLoading: false,
            errorMessage: '',
          });
        }
      } catch (error) {
        if (isActive) {
          setState({
            memberId,
            notifications: [],
            unreadCount: 0,
            totalPages: 0,
            isLoading: false,
            errorMessage: getErrorMessage(error),
          });
        }
      }
    };

    loadNotifications();

    return () => {
      isActive = false;
    };
  }, [isAuthenticated, memberId, reloadToken]);

  const isCurrentMember = isAuthenticated && state.memberId === memberId;

  const notifications = useMemo(
    () => (isCurrentMember ? state.notifications : []),
    [isCurrentMember, state.notifications],
  );

  /** 설계서 S-09: 헤더 알림창에는 안 읽은 알림만 보여 준다. */
  const unreadNotifications = useMemo(
    () => notifications.filter((notification) => !notification.isRead),
    [notifications],
  );

  /** 읽음·삭제 뒤에는 서버의 안 읽은 개수와 목록을 다시 받는다. 로딩 표시는 하지 않는다. */
  const refresh = useCallback(() => setReloadToken((previous) => previous + 1), []);

  const markAsRead = useCallback(
    async (notificationId) => {
      try {
        await notificationApi.markNotificationAsRead(notificationId);
        setState((previous) => ({
          ...previous,
          notifications: previous.notifications.map((notification) =>
            notification.id === notificationId ? { ...notification, isRead: true } : notification,
          ),
        }));
        refresh();
      } catch (error) {
        setState((previous) => ({ ...previous, errorMessage: getErrorMessage(error) }));
      }
    },
    [refresh],
  );

  const removeNotification = useCallback(
    async (notificationId) => {
      try {
        await notificationApi.deleteNotification(notificationId);
        setState((previous) => ({
          ...previous,
          notifications: previous.notifications.filter(
            (notification) => notification.id !== notificationId,
          ),
        }));
        refresh();
        showSuccess(TOAST_MESSAGES.NOTIFICATION_DELETED);
      } catch (error) {
        showError(getErrorMessage(error));
      }
    },
    [refresh, showError, showSuccess],
  );

  const refetch = useCallback(() => {
    setState((previous) => ({ ...previous, isLoading: true, errorMessage: '' }));
    setReloadToken((previous) => previous + 1);
  }, []);

  const value = useMemo(
    () => ({
      notifications,
      unreadNotifications,
      isLoading: isAuthenticated && (!isCurrentMember || state.isLoading),
      errorMessage: isCurrentMember ? state.errorMessage : '',
      unreadCount: isCurrentMember ? state.unreadCount : 0,
      totalPages: isCurrentMember ? state.totalPages : 0,
      /** 알림을 다시 받을 때마다 올라간다. 다른 페이지를 보는 화면이 이 값을 보고 함께 다시 받는다. */
      revision: reloadToken,
      markAsRead,
      removeNotification,
      refetch,
    }),
    [
      notifications,
      unreadNotifications,
      isAuthenticated,
      isCurrentMember,
      state.isLoading,
      state.errorMessage,
      state.unreadCount,
      state.totalPages,
      reloadToken,
      markAsRead,
      removeNotification,
      refetch,
    ],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export default NotificationProvider;
