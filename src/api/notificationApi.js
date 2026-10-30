import { ENDPOINTS } from './endpoints';
import httpClient from './httpClient';

const unwrapResult = (response) => response?.result ?? response;

export const NOTIFICATION_PAGE_SIZE = 8;

export const toNotification = (notification) => ({
  id: notification.id ?? notification.notification_id,
  memberId: notification.memberId ?? notification.member_id,
  policyId: notification.policyId ?? notification.policy_id,
  title: notification.title ?? notification.content ?? '',
  body: notification.body ?? notification.policyName ?? notification.policy_name ?? '',
  isRead: Boolean(notification.isRead ?? notification.read_yn),
  applyPeriodType: notification.applyPeriodType,
  applyEndDate: notification.applyEndDate ?? notification.apply_end_date,
  createdAt: notification.createdAt ?? notification.created_at,
});

export const toNotificationList = (response) => {
  const result = unwrapResult(response) ?? {};

  return {
    content: (result.notifications ?? result.content ?? []).map(toNotification),
    // 현재 페이지가 아니라 삭제되지 않은 전체 알림 중 안 읽은 개수다.
    unreadCount: Number(result.unread_count ?? 0),
    page: Number(result.page ?? 0),
    size: Number(result.size ?? NOTIFICATION_PAGE_SIZE),
    totalCount: Number(result.totalElements ?? result.totalCount ?? 0),
    totalPages: Number(result.totalPages ?? 0),
    hasNext: Boolean(result.hasNext),
  };
};

export const getNotifications = async ({ page = 0, size = NOTIFICATION_PAGE_SIZE } = {}) =>
  toNotificationList(await httpClient.get(ENDPOINTS.NOTIFICATION.LIST, { params: { page, size } }));

export const markNotificationAsRead = async (notificationId) =>
  toNotification(unwrapResult(await httpClient.patch(ENDPOINTS.NOTIFICATION.READ(notificationId))));

export const deleteNotification = (notificationId) =>
  httpClient.delete(ENDPOINTS.NOTIFICATION.DETAIL(notificationId));
