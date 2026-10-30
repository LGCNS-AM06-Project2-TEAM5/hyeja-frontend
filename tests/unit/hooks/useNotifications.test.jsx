import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import NotificationProvider from '@/contexts/NotificationProvider';
import { useNotifications } from '@/hooks/useNotifications';

const mocks = vi.hoisted(() => ({
  getNotifications: vi.fn(),
  markNotificationAsRead: vi.fn(),
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

vi.mock('@/api/notificationApi', () => ({
  getNotifications: mocks.getNotifications,
  markNotificationAsRead: mocks.markNotificationAsRead,
  deleteNotification: vi.fn(),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ isAuthenticated: true, user: { id: 1 } }),
}));

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ showError: mocks.showError, showSuccess: mocks.showSuccess }),
}));

const renderNotifications = () =>
  renderHook(() => useNotifications(), { wrapper: NotificationProvider });

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useNotifications', () => {
  it('안 읽은 개수는 받아 온 페이지가 아니라 서버가 준 전체 개수를 쓴다', async () => {
    mocks.getNotifications.mockResolvedValue({
      content: [
        { id: 1, isRead: false },
        { id: 2, isRead: true },
      ],
      unreadCount: 15,
    });

    const { result } = renderNotifications();

    await waitFor(() => expect(result.current.unreadCount).toBe(15));
    expect(result.current.unreadNotifications).toEqual([{ id: 1, isRead: false }]);
  });

  it('읽음 처리하면 목록을 다시 받아 서버의 안 읽은 개수로 맞춘다', async () => {
    mocks.getNotifications
      .mockResolvedValueOnce({ content: [{ id: 1, isRead: false }], unreadCount: 15 })
      .mockResolvedValueOnce({ content: [{ id: 1, isRead: true }], unreadCount: 14 });
    mocks.markNotificationAsRead.mockResolvedValue({});

    const { result } = renderNotifications();
    await waitFor(() => expect(result.current.unreadCount).toBe(15));

    await act(() => result.current.markAsRead(1));

    await waitFor(() => expect(result.current.unreadCount).toBe(14));
    expect(result.current.notifications).toEqual([{ id: 1, isRead: true }]);
    expect(mocks.getNotifications).toHaveBeenCalledTimes(2);
  });

  it('읽음 처리에 실패하면 알림을 그대로 두고 오류를 알린다', async () => {
    mocks.getNotifications.mockResolvedValue({
      content: [{ id: 1, isRead: false }],
      unreadCount: 1,
    });
    mocks.markNotificationAsRead.mockRejectedValue(new Error('읽음 처리 실패'));

    const { result } = renderNotifications();
    await waitFor(() => expect(result.current.unreadCount).toBe(1));

    await act(() => result.current.markAsRead(1));

    expect(result.current.notifications).toEqual([{ id: 1, isRead: false }]);
    expect(result.current.errorMessage).toBe(
      '서버에 연결하지 못했어요. 잠시 후 다시 시도해 주세요',
    );
    expect(mocks.getNotifications).toHaveBeenCalledTimes(1);
  });
});
