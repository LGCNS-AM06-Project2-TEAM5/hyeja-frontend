import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ENDPOINTS } from '@/api/endpoints';
import httpClient from '@/api/httpClient';
import { deleteAccount } from '@/api/userApi';

vi.mock('@/api/httpClient', () => ({
  default: { patch: vi.fn() },
}));

describe('회원 탈퇴 API', () => {
  beforeEach(() => {
    httpClient.patch.mockReset();
  });

  it('비밀번호를 담아 PATCH 요청하고 응답 봉투의 result를 반환한다', async () => {
    httpClient.patch.mockResolvedValue({
      isSuccess: true,
      code: 'SUCCESS_001',
      message: '회원 탈퇴에 성공했습니다.',
      result: '회원 탈퇴가 완료되었습니다.',
    });

    await expect(deleteAccount('hyeja1234!')).resolves.toBe('회원 탈퇴가 완료되었습니다.');
    expect(httpClient.patch).toHaveBeenCalledWith(ENDPOINTS.USER.DELETE, {
      password: 'hyeja1234!',
    });
  });
});
