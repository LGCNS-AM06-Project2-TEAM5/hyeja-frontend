import { screen } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import { ENDPOINTS } from '@/api/endpoints';
import { ROUTES } from '@/constants/routes';

import { renderApp } from '../../helpers/renderApp';
import { apiUrl, ok } from '../../msw/respond';
import { server } from '../../msw/server';

describe('이메일 찾기', () => {
  it('닉네임과 생년월일을 GET query로 보내고 마스킹 이메일과 가입일을 보여 준다', async () => {
    let requestInfo;
    server.use(
      http.get(apiUrl(ENDPOINTS.AUTH.FIND_EMAIL), ({ request }) => {
        const url = new URL(request.url);
        requestInfo = {
          nickname: url.searchParams.get('nickname'),
          birth: url.searchParams.get('birth'),
          authorization: request.headers.get('Authorization'),
        };

        return ok({
          isSuccess: true,
          code: 'SUCCESS_001',
          result: { email: 'min***@hyeja.kr', joinedAt: '2026-09-20' },
        });
      }),
    );
    const { user } = renderApp(ROUTES.FIND_EMAIL);

    await user.type(await screen.findByLabelText(/닉네임/), '민지');
    await user.type(screen.getByLabelText(/생년월일/), '2000-03-15');
    await user.click(screen.getByRole('button', { name: '이메일 찾기' }));

    expect(await screen.findByText(/min\*\*\*@hyeja\.kr/)).toBeInTheDocument();
    expect(screen.getByText(/가입일: 2026-09-20/)).toBeInTheDocument();
    expect(requestInfo).toEqual({
      nickname: '민지',
      birth: '2000-03-15',
      authorization: null,
    });
  });

  it('일치하는 가입 정보가 없으면 MEMBER_004 안내를 보여 준다', async () => {
    server.use(
      http.get(apiUrl(ENDPOINTS.AUTH.FIND_EMAIL), () =>
        HttpResponse.json(
          {
            isSuccess: false,
            code: 'MEMBER_004',
            message: '가입된 정보를 찾을 수 없습니다.',
            result: null,
          },
          { status: 404 },
        ),
      ),
    );
    const { user } = renderApp(ROUTES.FIND_EMAIL);

    await user.type(await screen.findByLabelText(/닉네임/), '없는회원');
    await user.type(screen.getByLabelText(/생년월일/), '2000-03-15');
    await user.click(screen.getByRole('button', { name: '이메일 찾기' }));

    expect(
      await screen.findByText('입력한 정보와 일치하는 가입 내역이 없어요'),
    ).toBeInTheDocument();
  });
});
