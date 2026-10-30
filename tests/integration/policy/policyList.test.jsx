/**
 * I-9 홈 정책 목록의 에러·빈 상태 (S-01)
 *
 * notice: 실제 백엔드 없이 MSW가 정책 목록에 응답한다. 500·빈 배열은 server.use로 만든다.
 */
import { screen } from '@testing-library/react';
import { http } from 'msw';
import { describe, expect, it } from 'vitest';

import { ENDPOINTS } from '@/api/endpoints';
import { EMPTY_MESSAGES, ERROR_MESSAGES } from '@/constants/messages';

import { renderApp, signInAs } from '../../helpers/renderApp';
import {
  EMPTY_POLICY_PAGE,
  MEMBER_CONDITION_SUMMARY,
  POLICY,
  POLICY_PAGE,
  TOKENS,
  buildPolicyList,
} from '../../msw/fixtures';
import { apiUrl, fail, ok } from '../../msw/respond';
import { server } from '../../msw/server';

describe('홈 정책 목록', () => {
  it('로그인 회원에게 내 조건 조회 결과로 만든 조건 요약을 보여 준다', async () => {
    signInAs(TOKENS.MEMBER);
    renderApp('/home');

    expect(
      await screen.findByText(
        `${MEMBER_CONDITION_SUMMARY} 기준으로 찾아요`,
        { exact: false },
        { timeout: 5000 },
      ),
    ).toBeInTheDocument();
  });

  it('비로그인 목록 API에 명세 파라미터만 전달하고 정책과 건수를 보여 준다', async () => {
    let requestInfo;

    server.use(
      http.get(apiUrl(ENDPOINTS.POLICY.LIST), ({ request }) => {
        const url = new URL(request.url);
        requestInfo = {
          authorization: request.headers.get('Authorization'),
          category: url.searchParams.get('category'),
          sort: url.searchParams.get('sort'),
          onlyEligible: url.searchParams.get('onlyEligible'),
          page: url.searchParams.get('page'),
          size: url.searchParams.get('size'),
        };

        return ok({
          isSuccess: true,
          result: buildPolicyList({ isAuthenticated: false }),
        });
      }),
    );
    renderApp('/home');

    expect(
      await screen.findByText(`신청 중 ${POLICY_PAGE.totalCount}건`, undefined, { timeout: 5000 }),
    ).toBeInTheDocument();
    expect(requestInfo).toEqual({
      authorization: null,
      category: null,
      sort: 'DEADLINE',
      onlyEligible: null,
      page: '0',
      size: '8',
    });
    POLICY_PAGE.content.forEach((policy) => {
      expect(screen.getAllByText(policy.title).length).toBeGreaterThan(0);
    });
  });

  it('서버 오류면 오류 상태와 토스트를 보여 주고, 다시 시도하면 목록을 불러온다', async () => {
    server.use(http.get(apiUrl(ENDPOINTS.POLICY.LIST), () => fail(500), { once: true }));
    const { user } = renderApp('/home');

    expect(await screen.findByText(ERROR_MESSAGES.SERVER)).toBeInTheDocument();
    expect(screen.getByText(ERROR_MESSAGES.POLICY_LOAD_FAILED)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '다시 시도' }));

    expect(await screen.findByText(`신청 중 ${POLICY_PAGE.totalCount}건`)).toBeInTheDocument();
  });

  it('정책이 없으면 빈 상태를 보여 준다', async () => {
    server.use(http.get(apiUrl(ENDPOINTS.POLICY.LIST), () => ok(EMPTY_POLICY_PAGE)));
    renderApp('/home');

    expect(await screen.findByText(EMPTY_MESSAGES.POLICY_LIST)).toBeInTheDocument();
    expect(screen.getByText('신청 중 0건')).toBeInTheDocument();
  });

  it('로그인하면 토큰과 회원 필터를 회원용 목록 API에 전달한다', async () => {
    let requestInfo;

    server.use(
      http.get(apiUrl(ENDPOINTS.POLICY.MEMBER_LIST), ({ request }) => {
        const url = new URL(request.url);
        requestInfo = {
          authorization: request.headers.get('Authorization'),
          category: url.searchParams.get('category'),
          sort: url.searchParams.get('sort'),
          onlyEligible: url.searchParams.get('onlyEligible'),
          page: url.searchParams.get('page'),
          size: url.searchParams.get('size'),
        };

        return ok({
          isSuccess: true,
          result: {
            policies: [
              {
                policy_id: String(POLICY.id),
                policy_name: POLICY.title,
                category_codes: ['MONTHLY_RENT'],
                category_names: ['월세'],
                regions: [],
                nationwide: true,
                apply_end_date: POLICY.applyEndDate,
                apply_period_code: 'SPECIFIC_PERIOD',
                d_day: 4,
                favorite_yn: true,
              },
            ],
            page: 0,
            size: 8,
            totalElements: 1,
            totalPages: 1,
            hasNext: false,
          },
        });
      }),
    );
    signInAs(TOKENS.MEMBER);
    renderApp('/home');

    expect(await screen.findByText('신청 중 1건')).toBeInTheDocument();
    expect(requestInfo).toEqual({
      authorization: `Bearer ${TOKENS.MEMBER}`,
      category: null,
      sort: 'DEADLINE',
      onlyEligible: 'false',
      page: '0',
      size: '8',
    });
    expect(screen.getByRole('button', { name: '관심 정책 해제' })).toBeInTheDocument();
  });
});
