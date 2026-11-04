/**
 * I-13 관리자 이벤트 동기화 흐름
 *
 * notice: policy 쪽 숫자(대기·보냄)는 GET /api/policies/admin/events, engagement 쪽 숫자(반영·중복 무시·DLT)는
 *         engagement가 내보내는 hyeja_policy_updated_* 지표(Prometheus)에서 온다.
 */
import { screen, within } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ROUTES } from '@/constants/routes';

import { renderApp, signInAs } from '../../helpers/renderApp';
import {
  PROMETHEUS_QUERIES,
  PROMETHEUS_RESULTS,
  TOKENS,
  prometheusResponse,
} from '../../msw/fixtures';
import { server } from '../../msw/server';

const endpoint = 'http://monitoring.test/api/v1/query';

const openEventsTab = async () => {
  signInAs(TOKENS.ADMIN);
  const view = renderApp(ROUTES.ADMIN);
  await screen.findByRole('heading', { name: '관리 · 운영 현황' }, { timeout: 2000 });
  await view.user.click(screen.getByRole('tab', { name: '이벤트 동기화' }));

  return view;
};

beforeEach(() => vi.stubEnv('VITE_PROMETHEUS_URL', 'http://monitoring.test'));
afterEach(() => vi.unstubAllEnvs());

describe('관리자 이벤트 동기화 흐름', () => {
  it('policy 대기·보냄과 engagement 반영·중복 무시·DLT를 한 줄로 보여 준다', async () => {
    await openEventsTab();
    const pipeline = within(await screen.findByRole('region', { name: 'policy-updated 흐름' }));

    expect(await pipeline.findByText('대기 1건 · 보냄 2건')).toBeInTheDocument();
    expect(await pipeline.findByText('반영 12건 · 중복 무시 3건')).toBeInTheDocument();
    expect(pipeline.getByText('DLT 1건')).toBeInTheDocument();
  });

  it('engagement 지표가 아직 없으면 지어내지 않고 측정 전으로 보여 준다', async () => {
    server.use(
      http.get(endpoint, ({ request }) => {
        const query = new URL(request.url).searchParams.get('query');
        const empty = [PROMETHEUS_QUERIES.policyEvents, PROMETHEUS_QUERIES.policyDlt];

        return HttpResponse.json(
          prometheusResponse(empty.includes(query) ? [] : (PROMETHEUS_RESULTS[query] ?? [])),
        );
      }),
    );
    await openEventsTab();
    const pipeline = within(await screen.findByRole('region', { name: 'policy-updated 흐름' }));

    expect(await pipeline.findByText('반영 측정 전 · 중복 무시 측정 전')).toBeInTheDocument();
    expect(pipeline.getByText('DLT 측정 전')).toBeInTheDocument();
  });

  it('회원 탈퇴 이벤트 흐름도 함께 보여 준다', async () => {
    await openEventsTab();

    expect(
      await screen.findByRole('region', { name: 'member-withdrawn 흐름' }),
    ).toBeInTheDocument();
  });
});
