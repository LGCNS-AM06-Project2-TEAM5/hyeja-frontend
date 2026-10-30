import { beforeEach, describe, expect, it, vi } from 'vitest';

import { logout } from '@/api/authApi';
import { ENDPOINTS } from '@/api/endpoints';
import httpClient from '@/api/httpClient';

vi.mock('@/api/httpClient', () => ({
  default: { post: vi.fn() },
}));

describe('로그아웃 API', () => {
  beforeEach(() => {
    httpClient.post.mockReset();
  });

  it('POST 요청 후 응답 봉투의 result를 반환한다', async () => {
    httpClient.post.mockResolvedValue({
      isSuccess: true,
      code: 'SUCCESS_001',
      message: '로그아웃에 성공했습니다.',
      result: '로그아웃되었습니다.',
    });

    await expect(logout()).resolves.toBe('로그아웃되었습니다.');
    expect(httpClient.post).toHaveBeenCalledWith(ENDPOINTS.AUTH.LOGOUT);
  });
});
