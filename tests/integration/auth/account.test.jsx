import { screen, waitFor, within } from '@testing-library/react';
import { http } from 'msw';
import { describe, expect, it } from 'vitest';

import { ENDPOINTS } from '@/api/endpoints';
import { buildMyPagePath, MY_PAGE_TABS } from '@/constants/routes';

import { findHeader, renderApp, signInAs } from '../../helpers/renderApp';
import {
  MEMBER_ACCOUNT_RESPONSE,
  MEMBER_CREDENTIALS,
  MEMBER_USER,
  TOKENS,
} from '../../msw/fixtures';
import { apiUrl, ok } from '../../msw/respond';
import { server } from '../../msw/server';

describe('회원 계정 조회', () => {
  it('Bearer 토큰으로 계정을 조회하고 마이페이지에 회원 정보를 표시한다', async () => {
    let requestInfo;
    server.use(
      http.get(apiUrl(ENDPOINTS.USER.ME), ({ request }) => {
        const url = new URL(request.url);
        requestInfo = {
          authorization: request.headers.get('Authorization'),
          memberId: url.searchParams.get('memberId'),
        };

        return ok(MEMBER_ACCOUNT_RESPONSE);
      }),
    );
    signInAs(TOKENS.MEMBER);
    renderApp(buildMyPagePath(MY_PAGE_TABS.ACCOUNT));

    expect(await screen.findByText(MEMBER_ACCOUNT_RESPONSE.result.email)).toBeInTheDocument();
    expect(screen.getAllByText(MEMBER_ACCOUNT_RESPONSE.result.nickname).length).toBeGreaterThan(0);
    expect(
      screen.getByText(MEMBER_ACCOUNT_RESPONSE.result.createdAt.slice(0, 10)),
    ).toBeInTheDocument();
    expect(requestInfo).toEqual({
      authorization: `Bearer ${TOKENS.MEMBER}`,
      memberId: null,
    });
  });

  // 로그인 응답에는 가입일이 없어서, 새로고침 전까지 계정 탭의 가입일이 비어 있던 문제
  it('로그인 모달로 로그인한 직후에도 계정 탭에 가입일을 표시한다', async () => {
    const { user } = renderApp('/home');
    const header = await findHeader();
    await user.click(header.getByRole('button', { name: '로그인' }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText('이메일'), MEMBER_CREDENTIALS.email);
    await user.type(within(dialog).getByLabelText('비밀번호'), MEMBER_CREDENTIALS.password);
    await user.click(within(dialog).getByRole('button', { name: '로그인' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    await user.click(header.getByRole('button', { name: MEMBER_USER.nickname }));
    await user.click(await screen.findByRole('menuitem', { name: '마이페이지' }));
    await user.click(await screen.findByRole('tab', { name: '계정' }));

    expect(
      await screen.findByText(MEMBER_ACCOUNT_RESPONSE.result.createdAt.slice(0, 10)),
    ).toBeInTheDocument();
  });
});
