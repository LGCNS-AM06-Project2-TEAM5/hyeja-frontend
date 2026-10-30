import { screen, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import { ENDPOINTS } from '@/api/endpoints';
import { TOAST_MESSAGES } from '@/constants/messages';
import { tokenStorage } from '@/utils/tokenStorage';

import { findHeader, renderApp, signInAs } from '../../helpers/renderApp';
import { MEMBER_ACCOUNT_RESPONSE, MEMBER_USER, TOKENS } from '../../msw/fixtures';
import { apiUrl, ok } from '../../msw/respond';
import { server } from '../../msw/server';

describe('로그아웃', () => {
  it('Bearer 토큰을 무효화하고 프론트 세션을 정리한다', async () => {
    let logoutAuthorization;
    let isRevoked = false;
    server.use(
      http.post(apiUrl(ENDPOINTS.AUTH.LOGOUT), ({ request }) => {
        logoutAuthorization = request.headers.get('Authorization');
        isRevoked = logoutAuthorization === `Bearer ${TOKENS.MEMBER}`;

        return ok({
          isSuccess: true,
          code: 'SUCCESS_001',
          message: '로그아웃에 성공했습니다.',
          result: '로그아웃되었습니다.',
        });
      }),
      http.get(apiUrl(ENDPOINTS.USER.ME), ({ request }) => {
        const authorization = request.headers.get('Authorization');

        if (isRevoked && authorization === `Bearer ${TOKENS.MEMBER}`) {
          return HttpResponse.json(
            {
              isSuccess: false,
              code: 'COMMON_002',
              message: '인증이 필요합니다.',
              result: null,
            },
            { status: 401 },
          );
        }

        return ok(MEMBER_ACCOUNT_RESPONSE);
      }),
    );
    signInAs(TOKENS.MEMBER);
    const { user } = renderApp('/');
    const header = await findHeader();

    await user.click(await header.findByRole('button', { name: MEMBER_USER.nickname }));
    await user.click(await screen.findByRole('menuitem', { name: '로그아웃' }));

    await waitFor(() => expect(tokenStorage.getAccessToken()).toBeNull());
    expect(logoutAuthorization).toBe(`Bearer ${TOKENS.MEMBER}`);
    expect(await header.findByRole('button', { name: '로그인' })).toBeInTheDocument();

    const reusedResponse = await fetch(apiUrl(ENDPOINTS.USER.ME), {
      headers: { Authorization: `Bearer ${TOKENS.MEMBER}` },
    });
    const reusedBody = await reusedResponse.json();

    expect(reusedResponse.status).toBe(401);
    expect(reusedBody.code).toBe('COMMON_002');
  });

  it('토큰 없이 요청하면 COMMON_002로 거절한다', async () => {
    const response = await fetch(apiUrl(ENDPOINTS.AUTH.LOGOUT), { method: 'POST' });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.code).toBe('COMMON_002');
  });

  it('토큰이 만료돼 로그아웃 요청이 401이어도 로그아웃을 마치고 안내한다', async () => {
    server.use(
      http.post(apiUrl(ENDPOINTS.AUTH.LOGOUT), () =>
        HttpResponse.json(
          { isSuccess: false, code: 'COMMON_002', message: '인증이 필요합니다.', result: null },
          { status: 401 },
        ),
      ),
    );
    signInAs(TOKENS.MEMBER);
    const { user } = renderApp('/');
    const header = await findHeader();

    await user.click(await header.findByRole('button', { name: MEMBER_USER.nickname }));
    await user.click(await screen.findByRole('menuitem', { name: '로그아웃' }));

    expect(await screen.findByText(TOAST_MESSAGES.LOGOUT_DONE)).toBeInTheDocument();
    expect(await header.findByRole('button', { name: '로그인' })).toBeInTheDocument();
    expect(tokenStorage.getAccessToken()).toBeNull();
  });
});
