/**
 * I-3 세션 복구
 *
 * notice: 실제 백엔드 없이 MSW가 /me에 응답한다. 401·네트워크 오류는 server.use로 테스트마다 만든다.
 * notice: 지금은 access token만 쓰고 refresh 흐름이 없다. 백엔드 인증 방식(토큰 재발급 등)이 정해지면
 *         "만료 → 재발급 → 복구" 케이스를 여기에 추가한다.
 */
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { ENDPOINTS } from '@/api/endpoints';
import { tokenStorage } from '@/utils/tokenStorage';

import { findHeader, renderApp, signInAs } from '../../helpers/renderApp';
import { MEMBER_USER, TOKENS } from '../../msw/fixtures';
import { apiUrl, fail } from '../../msw/respond';
import { server } from '../../msw/server';

describe('세션 복구', () => {
  it('저장된 토큰이 있으면 /me로 회원 정보를 받아 로그인 상태가 된다', async () => {
    signInAs(TOKENS.MEMBER);
    renderApp('/');

    const header = await findHeader();
    expect(await header.findByRole('button', { name: MEMBER_USER.nickname })).toBeInTheDocument();
    expect(tokenStorage.getAccessToken()).toBe(TOKENS.MEMBER);
  });

  it('/me가 401이면 토큰을 지우고 비로그인 상태로 시작한다', async () => {
    server.use(http.get(apiUrl(ENDPOINTS.USER.ME), () => fail(401, '로그인이 필요한 서비스예요')));
    signInAs(TOKENS.MEMBER);
    renderApp('/');

    const header = await findHeader();
    expect(await header.findByRole('button', { name: '로그인' })).toBeInTheDocument();
    expect(tokenStorage.getAccessToken()).toBeNull();
    expect(tokenStorage.getRefreshToken()).toBeNull();
  });

  it('서버에 닿지 못한 것뿐이면 토큰은 남기고 비로그인 화면을 보여 준다', async () => {
    server.use(http.get(apiUrl(ENDPOINTS.USER.ME), () => HttpResponse.error()));
    signInAs(TOKENS.MEMBER);
    renderApp('/');

    const header = await findHeader();
    expect(await header.findByRole('button', { name: '로그인' })).toBeInTheDocument();
    expect(tokenStorage.getAccessToken()).toBe(TOKENS.MEMBER);
  });

  it('토큰이 없으면 /me를 부르지 않는다', async () => {
    let meRequestCount = 0;
    server.use(
      http.get(apiUrl(ENDPOINTS.USER.ME), () => {
        meRequestCount += 1;
        return fail(401, '로그인이 필요한 서비스예요');
      }),
    );
    renderApp('/');

    const header = await findHeader();
    expect(await header.findByRole('button', { name: '로그인' })).toBeInTheDocument();
    expect(meRequestCount).toBe(0);
  });
});
