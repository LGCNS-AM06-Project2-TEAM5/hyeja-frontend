import { beforeEach, describe, expect, it } from 'vitest';

import { findHandler } from '@/mocks/handlers';
import { mockStore } from '@/mocks/store';

const handlePost = (url, body) => findHandler('post', url).handle({ body });

const signupBody = (email) => ({
  email,
  password: 'hyeja1234!',
  nickname: '새내기',
  profile: {
    birth: '2000-03-15',
    regionCode: '11440',
    employmentCode: 'EMPLOYED',
    houselessYn: true,
  },
});

describe('개발용 목 서버 이메일 인증', () => {
  beforeEach(() => {
    mockStore.reset();
  });

  it('코드를 발송한 이메일과 확인 요청 이메일이 다르면 거부한다', () => {
    handlePost('/api/members/email-verifications', { email: 'sent@hyeja.kr' });

    const response = handlePost('/api/members/email-verifications/confirmation', {
      email: 'other@hyeja.kr',
      code: '384021',
    });

    expect(response.status).toBe(400);
  });

  it('인증하지 않은 이메일의 가입 요청을 거부한다', () => {
    const response = handlePost('/api/members', signupBody('not-verified@hyeja.kr'));

    expect(response).toEqual({
      status: 400,
      data: { message: '이메일 인증을 먼저 완료해 주세요' },
    });
  });

  it('발송한 코드를 확인한 이메일만 가입시킨다', () => {
    const email = 'verified@hyeja.kr';

    handlePost('/api/members/email-verifications', { email });
    const confirmation = handlePost('/api/members/email-verifications/confirmation', {
      email,
      code: '384021',
    });
    const signup = handlePost('/api/members', signupBody(email));

    expect(confirmation).toEqual({ status: 200, data: { verified: true } });
    expect(signup.status).toBe(200);
    expect(mockStore.getState().emailVerifications[email]).toBeUndefined();
  });

  it('틀릴 때마다 남은 시도 횟수를 주고, 5번째에 1시간 잠근 뒤 재발송도 막는다', () => {
    const email = 'lock-test@hyeja.kr';
    const confirm = (code) =>
      handlePost('/api/members/email-verifications/confirmation', { email, code });

    handlePost('/api/members/email-verifications', { email });

    for (const remainingAttempts of [4, 3, 2, 1]) {
      const response = confirm('000000');

      expect(response.status).toBe(400);
      expect(response.data.code).toBe('VERIFY_001');
      expect(response.data.result.remainingAttempts).toBe(remainingAttempts);
    }

    const locked = confirm('000000');
    expect(locked.status).toBe(429);
    expect(locked.data.code).toBe('VERIFY_005');

    expect(confirm('384021').data.code).toBe('VERIFY_005');
    expect(handlePost('/api/members/email-verifications', { email }).data.code).toBe('VERIFY_005');
  });
});
