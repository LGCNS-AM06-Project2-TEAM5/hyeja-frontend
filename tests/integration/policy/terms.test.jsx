import { screen } from '@testing-library/react';
import { http } from 'msw';
import { describe, expect, it } from 'vitest';

import { ENDPOINTS } from '@/api/endpoints';

import { renderApp } from '../../helpers/renderApp';
import { POLICY } from '../../msw/fixtures';
import { apiUrl, ok } from '../../msw/respond';
import { server } from '../../msw/server';

describe('정책 용어 풀이', () => {
  it('비로그인으로 전체 용어를 조회하고 정책 상세 문장의 용어 설명을 보여 준다', async () => {
    let requestInfo;

    server.use(
      http.get(apiUrl(ENDPOINTS.POLICY.TERMS), ({ request }) => {
        requestInfo = {
          path: new URL(request.url).pathname,
          authorization: request.headers.get('Authorization'),
        };

        return ok({
          isSuccess: true,
          code: 'SUCCESS_001',
          message: '용어 풀이 목록 조회에 성공했습니다.',
          result: [
            {
              termId: 1,
              term: '중위소득',
              easyDescription: '전체 가구를 소득 순서로 세웠을 때 가운데 가구의 소득입니다.',
              example: '중위소득 60% 이하인 가구',
            },
          ],
        });
      }),
    );
    const { user } = renderApp(`/policies/${POLICY.id}`);

    await screen.findByRole('heading', { name: POLICY.title });
    await user.hover((await screen.findAllByText('중위소득'))[0]);

    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      '전체 가구를 소득 순서로 세웠을 때 가운데 가구의 소득입니다.',
    );
    expect(requestInfo).toEqual({ path: ENDPOINTS.POLICY.TERMS, authorization: null });
  });
});
