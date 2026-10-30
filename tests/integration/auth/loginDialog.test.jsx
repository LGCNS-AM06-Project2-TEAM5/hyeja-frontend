/**
 * I-1 로그인 모달
 *
 * notice: 실제 백엔드 없이 MSW가 로그인 API에 응답한다(tests/msw/handlers.js).
 *         로그인 성공 계정은 목 데이터의 민지 계정(MEMBER_CREDENTIALS)만 받는다.
 */
import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { ENDPOINTS } from '@/api/endpoints';
import { VALIDATION_MESSAGES } from '@/constants/messages';
import { tokenStorage } from '@/utils/tokenStorage';

import { findHeader, renderApp } from '../../helpers/renderApp';
import { MEMBER_CREDENTIALS, MEMBER_USER, TOKENS } from '../../msw/fixtures';
import { apiUrl, ok } from '../../msw/respond';
import { server } from '../../msw/server';

const openLoginDialog = async (user) => {
  const header = await findHeader();
  await user.click(header.getByRole('button', { name: '로그인' }));

  return screen.findByRole('dialog');
};

const submitLogin = async (user, dialog, { email, password }) => {
  if (email) {
    await user.type(within(dialog).getByLabelText('이메일'), email);
  }
  if (password) {
    await user.type(within(dialog).getByLabelText('비밀번호'), password);
  }
  await user.click(within(dialog).getByRole('button', { name: '로그인' }));
};

describe('로그인 모달', () => {
  it('이메일이 비어 있으면 서버에 보내지 않고 입력 요청 문구를 보여 준다', async () => {
    const { user } = renderApp('/');
    const dialog = await openLoginDialog(user);

    await submitLogin(user, dialog, { password: MEMBER_CREDENTIALS.password });

    expect(within(dialog).getByText(VALIDATION_MESSAGES.REQUIRED_EMAIL)).toBeInTheDocument();
    expect(within(dialog).getByLabelText('이메일')).toHaveAttribute('aria-invalid', 'true');
  });

  it('비밀번호가 비어 있으면 비밀번호 입력 요청 문구를 보여 준다', async () => {
    const { user } = renderApp('/');
    const dialog = await openLoginDialog(user);

    await submitLogin(user, dialog, { email: MEMBER_CREDENTIALS.email });

    expect(within(dialog).getByText(VALIDATION_MESSAGES.REQUIRED_PASSWORD)).toBeInTheDocument();
  });

  it('로그인에 성공하면 모달이 닫히고 헤더가 로그인 상태로 바뀐다', async () => {
    let loginBody;
    let authorizationHeader;

    server.use(
      http.post(apiUrl(ENDPOINTS.AUTH.LOGIN), async ({ request }) => {
        loginBody = await request.json();

        return HttpResponse.json({
          isSuccess: true,
          code: 'SUCCESS_001',
          message: '요청에 성공했습니다.',
          result: {
            accessToken: TOKENS.MEMBER,
            memberId: MEMBER_USER.id,
            nickname: MEMBER_USER.nickname,
          },
        });
      }),
      http.get(apiUrl(ENDPOINTS.NOTIFICATION.LIST), ({ request }) => {
        authorizationHeader = request.headers.get('Authorization');
        return ok({ content: [] });
      }),
    );

    const { user } = renderApp('/');
    const dialog = await openLoginDialog(user);

    await submitLogin(user, dialog, MEMBER_CREDENTIALS);

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    const header = await findHeader();
    expect(header.getByRole('button', { name: MEMBER_USER.nickname })).toBeInTheDocument();
    expect(header.getByRole('button', { name: '알림 열기' })).toBeInTheDocument();
    expect(header.queryByRole('button', { name: '로그인' })).not.toBeInTheDocument();
    expect(tokenStorage.getAccessToken()).toBe(TOKENS.MEMBER);
    expect(loginBody).toEqual(MEMBER_CREDENTIALS);
    await waitFor(() => expect(authorizationHeader).toBe(`Bearer ${TOKENS.MEMBER}`));
  });

  it('로그인에 실패하면 모달에 오류를 남기고 토스트로도 알린다', async () => {
    server.use(
      http.post(apiUrl(ENDPOINTS.AUTH.LOGIN), () =>
        HttpResponse.json(
          {
            isSuccess: false,
            code: 'MEMBER_005',
            message: '이메일 또는 비밀번호가 올바르지 않아요.',
            result: null,
          },
          { status: 401 },
        ),
      ),
    );

    const { user } = renderApp('/');
    const dialog = await openLoginDialog(user);

    await submitLogin(user, dialog, { email: 'wrong@hyeja.kr', password: 'wrong1234!' });

    const message = '이메일 또는 비밀번호가 올바르지 않아요.';
    expect(await within(dialog).findByText(message)).toBeInTheDocument();
    // 같은 문구가 모달 입력칸 아래와 토스트에 한 번씩 나온다.
    expect(screen.getAllByText(message)).toHaveLength(2);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(tokenStorage.getAccessToken()).toBeNull();
  });
});
