/**
 * I-4 401 인터셉터
 *
 * 로그인한 채로 쓰다가 요청 하나가 401을 받으면, httpClient가 토큰을 지우고
 * hyeja:unauthorized 이벤트로 화면 세션까지 정리하는지 본다.
 *
 * notice: 실제 백엔드 없이 MSW가 관심 목록 요청에만 401을 준다. 실제로는 토큰 만료·폐기 때 생기는 응답이다.
 */
import { screen, waitFor } from '@testing-library/react';
import { http } from 'msw';
import { describe, expect, it } from 'vitest';

import { ENDPOINTS } from '@/api/endpoints';
import { ROUTES } from '@/constants/routes';
import { tokenStorage } from '@/utils/tokenStorage';

import { findHeader, renderApp, signInAs } from '../../helpers/renderApp';
import { TOKENS } from '../../msw/fixtures';
import { apiUrl, fail } from '../../msw/respond';
import { server } from '../../msw/server';

describe('401 인터셉터', () => {
  it('보호 화면에서 401을 받으면 로그아웃 상태가 되어 홈으로 돌아가고 로그인 모달이 열린다', async () => {
    server.use(
      http.get(apiUrl(ENDPOINTS.FAVORITE.LIST), () => fail(401, '로그인이 필요한 서비스예요')),
    );
    signInAs(TOKENS.MEMBER);
    renderApp(ROUTES.FAVORITE);

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(window.location.pathname).toBe(ROUTES.HOME);
    expect(tokenStorage.getAccessToken()).toBeNull();
    expect(tokenStorage.getRefreshToken()).toBeNull();
  });

  it('공개 화면에서 401을 받으면 헤더가 비로그인 상태로 바뀐다', async () => {
    server.use(
      http.get(apiUrl(ENDPOINTS.NOTIFICATION.LIST), () => fail(401, '로그인이 필요한 서비스예요')),
    );
    signInAs(TOKENS.MEMBER);
    renderApp(ROUTES.HOME);

    await waitFor(() => expect(tokenStorage.getAccessToken()).toBeNull(), { timeout: 5000 });
    const header = await findHeader();
    expect(await header.findByRole('button', { name: '로그인' })).toBeInTheDocument();
    expect(window.location.pathname).toBe(ROUTES.HOME);
  });
});
