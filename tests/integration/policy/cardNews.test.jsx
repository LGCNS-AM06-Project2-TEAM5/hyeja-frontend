/**
 * 홈 카드뉴스 목록과 팝업 (S-01)
 *
 * notice: 실제 백엔드 없이 MSW가 카드뉴스 목록·상세(/api/policies/card-detail/{policyId})에 응답한다.
 * notice: 상세 응답의 dDay는 백엔드 CardNewsDetailResponseDTO(record)의 Integer dDay가
 *         어노테이션 없이 그대로 직렬화된 키를 따른다. 키가 바뀌면 fixtures.buildCardNewsDetailResponse와
 *         policyApi.toCardNewsDetail부터 맞춘다.
 * notice: 홈 팝업의 하트는 카드뉴스 상세 응답의 isFavorite 기준으로 보인다(관심 목록은 보지 않는다).
 */
import { screen, within } from '@testing-library/react';
import { http } from 'msw';
import { describe, expect, it } from 'vitest';

import { ENDPOINTS } from '@/api/endpoints';

import { renderApp, signInAs } from '../../helpers/renderApp';
import {
  CARD_NEWS_LIST_RESPONSE,
  POLICY,
  TOKENS,
  buildCardNewsDetailResponse,
} from '../../msw/fixtures';
import { apiUrl, ok } from '../../msw/respond';
import { server } from '../../msw/server';

const findFeaturedCardTitle = () =>
  screen.findByRole('heading', { name: POLICY.title, level: 1 }, { timeout: 5000 });

describe('홈 카드뉴스', () => {
  it('비로그인은 guest 목록을 호출하고 선택한 정책의 카드 상세를 팝업에 표시한다', async () => {
    const requests = [];

    server.use(
      http.get(apiUrl(ENDPOINTS.POLICY.GUEST_CARD_NEWS), ({ request }) => {
        requests.push({
          path: new URL(request.url).pathname,
          authorization: request.headers.get('Authorization'),
        });
        return ok(CARD_NEWS_LIST_RESPONSE);
      }),
      http.get(apiUrl(ENDPOINTS.POLICY.CARD_NEWS_DETAIL(':policyId')), ({ params }) => {
        requests.push({ path: ENDPOINTS.POLICY.CARD_NEWS_DETAIL(params.policyId) });
        return ok(buildCardNewsDetailResponse(POLICY));
      }),
    );
    const { user } = renderApp('/home');

    const cardTitle = await findFeaturedCardTitle();
    await user.click(cardTitle);

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getAllByText(POLICY.title)).toHaveLength(2);
    expect(within(dialog).getByText('1 / 4 · 무슨 정책인가요')).toBeInTheDocument();
    expect(requests).toEqual([
      { path: ENDPOINTS.POLICY.GUEST_CARD_NEWS, authorization: null },
      { path: ENDPOINTS.POLICY.CARD_NEWS_DETAIL(String(POLICY.id)) },
    ]);
  }, 10000);

  it('카드가 1장만 오면 나머지 장은 번호만 보이는 빈 카드로 채운다', async () => {
    const detailResponse = buildCardNewsDetailResponse(POLICY);

    server.use(
      http.get(apiUrl(ENDPOINTS.POLICY.CARD_NEWS_DETAIL(':policyId')), () =>
        ok({
          ...detailResponse,
          result: { ...detailResponse.result, cards: detailResponse.result.cards.slice(0, 1) },
        }),
      ),
    );
    const { user } = renderApp('/home');

    await user.click(await findFeaturedCardTitle());

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('1 / 4 · 무슨 정책인가요')).toBeInTheDocument();
    for (const counter of ['2 / 4', '3 / 4', '4 / 4']) {
      expect(within(dialog).getByText(counter)).toBeInTheDocument();
    }
    expect(within(dialog).queryByText(/누가 받을 수 있나요/)).not.toBeInTheDocument();
  });

  it('로그인은 토큰으로 회원 카드뉴스 목록을 호출한다', async () => {
    let authorization;

    server.use(
      http.get(apiUrl(ENDPOINTS.POLICY.CARD_NEWS), ({ request }) => {
        authorization = request.headers.get('Authorization');
        return ok(CARD_NEWS_LIST_RESPONSE);
      }),
    );
    signInAs(TOKENS.MEMBER);
    renderApp('/home');

    expect(await findFeaturedCardTitle()).toBeInTheDocument();
    expect(authorization).toBe(`Bearer ${TOKENS.MEMBER}`);
  });

  it('상세 응답의 dDay가 숫자면 팝업 윗줄에 D-day 배지를 보여 준다', async () => {
    const detailResponse = buildCardNewsDetailResponse(POLICY);

    server.use(
      http.get(apiUrl(ENDPOINTS.POLICY.CARD_NEWS_DETAIL(':policyId')), () =>
        ok({ ...detailResponse, result: { ...detailResponse.result, dDay: 5 } }),
      ),
    );
    const { user } = renderApp('/home');

    await user.click(await findFeaturedCardTitle());

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('D-5')).toBeInTheDocument();
  });

  it('로그인 상태로 팝업을 열면 토큰으로 상세를 요청하고 관심 정책은 하트를 채워 보여 준다', async () => {
    let authorization;

    server.use(
      http.get(apiUrl(ENDPOINTS.POLICY.CARD_NEWS_DETAIL(':policyId')), ({ request }) => {
        authorization = request.headers.get('Authorization');
        return ok(buildCardNewsDetailResponse(POLICY, { isAuthenticated: true }));
      }),
    );
    signInAs(TOKENS.MEMBER);
    const { user } = renderApp('/home');

    await user.click(await findFeaturedCardTitle());

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('button', { name: '관심 정책 해제' })).toBeInTheDocument();
    expect(authorization).toBe(`Bearer ${TOKENS.MEMBER}`);
  });
});
