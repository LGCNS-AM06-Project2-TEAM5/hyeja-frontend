/**
 * I-2 보호 경로 접근 제어
 *
 * notice: 실제 백엔드 없이 MSW가 /me에 응답한다. 토큰 문자열로 일반 회원과 관리자를 구분한다(fixtures.TOKENS).
 * notice: 관리자 판별은 프론트 가정값(user.role === 'ADMIN')이다. 백엔드 권한 모델이 확정되면
 *         fixtures의 ADMIN_USER 모양과 이 테스트의 기대값을 함께 맞춘다.
 */
import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { TOAST_MESSAGES } from '@/constants/messages';
import { ROUTES } from '@/constants/routes';

import { renderApp, signInAs } from '../../helpers/renderApp';
import { TOKENS } from '../../msw/fixtures';

const ADMIN_HEADING = '관리 · 정책 수집';

describe('보호 경로 접근 제어', () => {
  it('비로그인으로 관심 정책에 들어가면 홈으로 보내고 로그인 모달을 연다', async () => {
    renderApp(ROUTES.FAVORITE);

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(window.location.pathname).toBe(ROUTES.HOME);
    expect(screen.getByText(TOAST_MESSAGES.LOGIN_REQUIRED)).toBeInTheDocument();
  });

  it('로그인한 회원은 관심 정책 화면을 그대로 본다', async () => {
    signInAs(TOKENS.MEMBER);
    renderApp(ROUTES.FAVORITE);

    expect(await screen.findByRole('heading', { name: '관심 정책' })).toBeInTheDocument();
    expect(window.location.pathname).toBe(ROUTES.FAVORITE);
  });

  it('일반 회원은 관리자 화면에 못 들어가고 홈으로 돌아간다', async () => {
    signInAs(TOKENS.MEMBER);
    renderApp(ROUTES.ADMIN);

    await waitFor(() => expect(window.location.pathname).toBe(ROUTES.HOME));
    expect(screen.queryByRole('heading', { name: ADMIN_HEADING })).not.toBeInTheDocument();
  });

  it.each([ROUTES.SIGNUP, ROUTES.FIND_EMAIL])(
    '로그인한 회원이 새로고침 후 %s로 들어가면 홈으로 보낸다',
    async (route) => {
      signInAs(TOKENS.MEMBER);
      renderApp(route);

      await waitFor(() => expect(window.location.pathname).toBe(ROUTES.HOME), { timeout: 5000 });
    },
  );

  it('관리자는 관리자 화면에 들어간다', async () => {
    signInAs(TOKENS.ADMIN);
    renderApp(ROUTES.ADMIN);

    expect(await screen.findByRole('heading', { name: ADMIN_HEADING })).toBeInTheDocument();
    expect(window.location.pathname).toBe(ROUTES.ADMIN);
  });
});
