import { screen, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import { ENDPOINTS } from '@/api/endpoints';
import { buildMyPagePath, MY_PAGE_TABS, ROUTES } from '@/constants/routes';
import { tokenStorage } from '@/utils/tokenStorage';

import { renderApp, signInAs } from '../../helpers/renderApp';
import { MEMBER_ACCOUNT_RESPONSE, TOKENS } from '../../msw/fixtures';
import { apiUrl, ok } from '../../msw/respond';
import { server } from '../../msw/server';

describe('회원 탈퇴', () => {
  it('Bearer 토큰으로 탈퇴하고 세션을 정리한 뒤 기존 토큰 접근을 차단한다', async () => {
    let withdrawalAuthorization;
    let withdrawalBody;
    let isWithdrawn = false;
    server.use(
      http.patch(apiUrl(ENDPOINTS.USER.DELETE), async ({ request }) => {
        withdrawalAuthorization = request.headers.get('Authorization');
        withdrawalBody = await request.json();
        isWithdrawn = withdrawalAuthorization === `Bearer ${TOKENS.MEMBER}`;

        return ok({
          isSuccess: true,
          code: 'SUCCESS_001',
          message: '회원 탈퇴에 성공했습니다.',
          result: '회원 탈퇴가 완료되었습니다.',
        });
      }),
      http.get(apiUrl(ENDPOINTS.USER.ME), ({ request }) => {
        if (isWithdrawn && request.headers.get('Authorization') === `Bearer ${TOKENS.MEMBER}`) {
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
    const { user } = renderApp(buildMyPagePath(MY_PAGE_TABS.ACCOUNT));

    await user.click(await screen.findByRole('button', { name: '회원 탈퇴' }, { timeout: 5000 }));
    await user.type(screen.getByLabelText('비밀번호'), 'hyeja1234!');
    await user.click(screen.getByRole('button', { name: '탈퇴할게요' }));

    await waitFor(() => expect(tokenStorage.getAccessToken()).toBeNull());
    expect(withdrawalAuthorization).toBe(`Bearer ${TOKENS.MEMBER}`);
    expect(withdrawalBody).toEqual({ password: 'hyeja1234!' });
    expect(window.location.pathname).toBe(ROUTES.HOME);

    const reusedResponse = await fetch(apiUrl(ENDPOINTS.USER.ME), {
      headers: { Authorization: `Bearer ${TOKENS.MEMBER}` },
    });
    expect(reusedResponse.status).toBe(401);
  });

  it('비밀번호를 비우거나 틀리면 창을 닫지 않고 입력칸 아래에 알린다', async () => {
    server.use(
      http.patch(apiUrl(ENDPOINTS.USER.DELETE), () =>
        HttpResponse.json(
          {
            isSuccess: false,
            code: 'MEMBER_006',
            message: '비밀번호가 일치하지 않습니다.',
            result: null,
          },
          { status: 400 },
        ),
      ),
    );
    signInAs(TOKENS.MEMBER);
    const { user } = renderApp(buildMyPagePath(MY_PAGE_TABS.ACCOUNT));

    await user.click(await screen.findByRole('button', { name: '회원 탈퇴' }, { timeout: 5000 }));
    await user.click(screen.getByRole('button', { name: '탈퇴할게요' }));
    expect(await screen.findByText('비밀번호를 입력해 주세요')).toBeInTheDocument();

    await user.type(screen.getByLabelText('비밀번호'), 'wrong-password1!');
    await user.click(screen.getByRole('button', { name: '탈퇴할게요' }));

    expect(await screen.findByText('비밀번호가 일치하지 않아요')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(tokenStorage.getAccessToken()).toBe(TOKENS.MEMBER);
  });
});
