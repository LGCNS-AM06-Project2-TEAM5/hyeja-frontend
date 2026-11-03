/**
 * I-11 관리자 이벤트 동기화 상태
 *
 * notice: MSW가 백엔드 GET /api/policies/admin/events 응답을 흉내 낸다.
 * notice: 응답 모양(pendingCount·publishedCount·lastPublishedAt·recentEvents)은 policy-service
 *         PolicyOutboxStatusDTO 기준이다. 형태가 바뀌면 fixtures의 POLICY_EVENT_STATUS_RESPONSE를 함께 고친다.
 */
import { screen, within } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import { ENDPOINTS } from '@/api/endpoints';
import { ROUTES } from '@/constants/routes';

import { renderApp, signInAs } from '../../helpers/renderApp';
import { POLICY_EVENT_STATUS_RESPONSE, TOKENS } from '../../msw/fixtures';
import { apiUrl } from '../../msw/respond';
import { server } from '../../msw/server';

const openAdminPage = async () => {
  signInAs(TOKENS.ADMIN);
  const view = renderApp(ROUTES.ADMIN);
  await screen.findByRole('heading', { name: '관리 · 정책 수집' }, { timeout: 5000 });

  return view;
};

const findEventCard = async () => {
  const title = await screen.findByText('이벤트 동기화');

  return title.closest('.MuiCard-root');
};

describe('관리자 이벤트 동기화 상태', () => {
  it('화면을 열면 보내기 대기·보낸 건수와 최근 이벤트를 보여 준다', async () => {
    await openAdminPage();
    const card = await findEventCard();

    expect(await within(card).findByText('보내기 대기 1건')).toBeInTheDocument();
    expect(within(card).getByText('보낸 이벤트 2건')).toBeInTheDocument();
    const [latest] = POLICY_EVENT_STATUS_RESPONSE.result.recentEvents;
    expect(within(card).getByText(latest.policyId)).toBeInTheDocument();
    expect(within(card).getByText('대기')).toBeInTheDocument();
  });

  it('새로고침을 누르면 다시 조회한다', async () => {
    const { user } = await openAdminPage();
    const card = await findEventCard();
    await within(card).findByText('보내기 대기 1건');

    server.use(
      http.get(apiUrl(ENDPOINTS.ADMIN.POLICY_EVENTS), () =>
        HttpResponse.json({
          ...POLICY_EVENT_STATUS_RESPONSE,
          result: { ...POLICY_EVENT_STATUS_RESPONSE.result, pendingCount: 0, publishedCount: 3 },
        }),
      ),
    );
    await user.click(within(card).getByRole('button', { name: '새로고침' }));

    expect(await within(card).findByText('보내기 대기 0건')).toBeInTheDocument();
    expect(within(card).getByText('보낸 이벤트 3건')).toBeInTheDocument();
  });

  it('이벤트가 하나도 없으면 빈 안내를 보여 준다', async () => {
    server.use(
      http.get(apiUrl(ENDPOINTS.ADMIN.POLICY_EVENTS), () =>
        HttpResponse.json({
          ...POLICY_EVENT_STATUS_RESPONSE,
          result: { pendingCount: 0, publishedCount: 0, lastPublishedAt: null, recentEvents: [] },
        }),
      ),
    );
    await openAdminPage();
    const card = await findEventCard();

    expect(await within(card).findByText('아직 보낸 이벤트가 없어요')).toBeInTheDocument();
  });

  it('조회가 막히면 오류 문구를 알려 준다', async () => {
    server.use(
      http.get(apiUrl(ENDPOINTS.ADMIN.POLICY_EVENTS), () =>
        HttpResponse.json(
          { isSuccess: false, code: 'COMMON_004', message: '접근 권한이 없습니다.', result: null },
          { status: 403 },
        ),
      ),
    );
    await openAdminPage();

    expect(await screen.findByText('접근 권한이 없습니다.')).toBeInTheDocument();
  });
});
