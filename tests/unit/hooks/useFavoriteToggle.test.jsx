import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useFavoriteToggle } from '@/hooks/useFavoriteToggle';

const mocks = vi.hoisted(() => ({
  auth: { isAuthenticated: true, user: { id: 1 } },
  addFavorite: vi.fn(),
  removeFavorite: vi.fn(),
  requireLogin: vi.fn(),
  showSuccess: vi.fn(),
  showError: vi.fn(),
}));

vi.mock('@/api/favoriteApi', () => ({
  addFavorite: mocks.addFavorite,
  removeFavorite: mocks.removeFavorite,
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mocks.auth,
}));

vi.mock('@/hooks/useLoginDialog', () => ({
  useLoginDialog: () => ({ requireLogin: mocks.requireLogin }),
}));

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ showSuccess: mocks.showSuccess, showError: mocks.showError }),
}));

const apiError = (status, code) =>
  Object.assign(new Error(code), { response: { status, data: { code } } });

beforeEach(() => {
  mocks.auth = { isAuthenticated: true, user: { id: 1 } };
  vi.clearAllMocks();
  mocks.addFavorite.mockResolvedValue();
  mocks.removeFavorite.mockResolvedValue();
});

describe('useFavoriteToggle', () => {
  it('누르기 전에는 응답의 isFavorite를 따르고, 누른 뒤에는 누른 결과를 보여 준다', async () => {
    const { result } = renderHook(() => useFavoriteToggle());

    expect(result.current.isFavorite(100, true)).toBe(true);
    expect(result.current.isFavorite(200, false)).toBe(false);

    await act(() => result.current.toggleFavorite(100, true));
    await act(() => result.current.toggleFavorite(200, false));

    expect(mocks.removeFavorite).toHaveBeenCalledWith(100);
    expect(mocks.addFavorite).toHaveBeenCalledWith(200);
    expect(result.current.isFavorite(100, true)).toBe(false);
    expect(result.current.isFavorite(200, false)).toBe(true);
  });

  it('이미 저장된 정책(409 FAVORITE_001)이면 오류 없이 저장된 상태로 맞춘다', async () => {
    mocks.addFavorite.mockRejectedValue(apiError(409, 'FAVORITE_001'));
    const { result } = renderHook(() => useFavoriteToggle());

    await act(() => result.current.toggleFavorite(100, false));

    expect(result.current.isFavorite(100, false)).toBe(true);
    expect(mocks.showError).not.toHaveBeenCalled();
  });

  it('이미 해제된 정책(404 FAVORITE_002)이면 오류 없이 해제된 상태로 맞춘다', async () => {
    mocks.removeFavorite.mockRejectedValue(apiError(404, 'FAVORITE_002'));
    const { result } = renderHook(() => useFavoriteToggle());

    await act(() => result.current.toggleFavorite(100, true));

    expect(result.current.isFavorite(100, true)).toBe(false);
    expect(mocks.showError).not.toHaveBeenCalled();
  });

  it('그 밖의 오류면 하트를 바꾸지 않고 오류를 알린다', async () => {
    mocks.addFavorite.mockRejectedValue(apiError(500, 'COMMON_500'));
    const { result } = renderHook(() => useFavoriteToggle());

    await act(() => result.current.toggleFavorite(100, false));

    expect(result.current.isFavorite(100, false)).toBe(false);
    expect(mocks.showError).toHaveBeenCalledTimes(1);
  });

  it('회원이 바뀌면 이전 회원이 누른 결과를 버린다', async () => {
    const { result, rerender } = renderHook(() => useFavoriteToggle());

    await act(() => result.current.toggleFavorite(100, false));
    expect(result.current.isFavorite(100, false)).toBe(true);

    mocks.auth = { isAuthenticated: true, user: { id: 2 } };
    rerender();

    expect(result.current.isFavorite(100, false)).toBe(false);
  });

  it('비로그인이면 저장하지 않고 로그인을 요구한다', async () => {
    mocks.auth = { isAuthenticated: false, user: null };
    const { result } = renderHook(() => useFavoriteToggle());

    await act(() => result.current.toggleFavorite(100, false));

    expect(mocks.requireLogin).toHaveBeenCalledTimes(1);
    expect(mocks.addFavorite).not.toHaveBeenCalled();
    expect(result.current.isFavorite(100, true)).toBe(false);
  });
});
