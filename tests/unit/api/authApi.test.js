import { describe, expect, it } from 'vitest';

import { toFindEmailParams } from '@/api/authApi';

describe('이메일 찾기 API', () => {
  it('닉네임과 생년월일만 query parameter로 변환한다', () => {
    expect(toFindEmailParams({ nickname: '민지', birth: '2000-03-15', ignored: 'value' })).toEqual({
      nickname: '민지',
      birth: '2000-03-15',
    });
  });
});
