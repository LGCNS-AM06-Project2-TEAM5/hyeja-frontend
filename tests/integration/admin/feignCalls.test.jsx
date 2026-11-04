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
const openDashboard = async () => {
  signInAs(TOKENS.ADMIN);
  const view = renderApp(ROUTES.ADMIN);
  await screen.findByRole('heading', { name: '관리 · 운영 현황' }, { timeout: 2000 });
  return view;
};
const flowRow = (id) =>
  within(screen.getByRole('table', { name: '서비스 간 호출' })).getByRole('row', {
    name: new RegExp(id),
  });

beforeEach(() => vi.stubEnv('VITE_PROMETHEUS_URL', 'http://monitoring.test'));
afterEach(() => vi.unstubAllEnvs());

describe('관리자 서비스 간 호출', () => {
  it('호출 관계·최근 5분 호출·실패 수와 측정 전 항목을 보여 준다', async () => {
    await openDashboard();
    await screen.findByRole('table', { name: '서비스 간 호출' });
    expect(await within(flowRow('F6')).findByText('19건')).toBeInTheDocument();
    expect(within(flowRow('F6')).getByText('5건')).toBeInTheDocument();
    expect(within(flowRow('F6')).getByText('policy → user')).toBeInTheDocument();
    expect(within(flowRow('F6')).getByText('측정 전')).toBeInTheDocument();
    expect(within(flowRow('F1')).getByText('최근 호출 없음')).toBeInTheDocument();
    expect(within(flowRow('F4')).getByText('8건')).toBeInTheDocument();
    expect(within(flowRow('F5')).getAllByText('측정 전')).toHaveLength(3);
  });

  it('Feign 조회만 실패하면 기존 서비스 상태는 남긴다', async () => {
    server.use(
      http.get(endpoint, ({ request }) => {
        const query = new URL(request.url).searchParams.get('query');
        return query === PROMETHEUS_QUERIES.feign
          ? HttpResponse.json({}, { status: 503 })
          : HttpResponse.json(prometheusResponse(PROMETHEUS_RESULTS[query]));
      }),
    );
    await openDashboard();
    await screen.findByText('4 / 5 정상');
    expect(within(flowRow('F6')).getAllByText('불러오지 못했어요')).toHaveLength(2);
    expect(within(flowRow('F5')).getAllByText('측정 전')).toHaveLength(3);
  });

  it('오류 라벨이 없는 응답의 실패 수는 0건으로 표시하지 않는다', async () => {
    server.use(
      http.get(endpoint, ({ request }) => {
        const query = new URL(request.url).searchParams.get('query');
        const data =
          query === PROMETHEUS_QUERIES.feign
            ? PROMETHEUS_RESULTS[query].map(({ metric, value }) => ({
                metric: {
                  application: metric.application,
                  clientName: metric.clientName,
                  http_status_code: metric.http_status_code,
                },
                value,
              }))
            : PROMETHEUS_RESULTS[query];
        return HttpResponse.json(prometheusResponse(data));
      }),
    );
    await openDashboard();
    await screen.findByText('4 / 5 정상');
    expect(within(flowRow('F6')).getByText('19건')).toBeInTheDocument();
    expect(within(flowRow('F6')).getAllByText('측정 전')).toHaveLength(2);
    expect(within(flowRow('F6')).queryByText('0건')).not.toBeInTheDocument();
  });

  it('새로고침은 서비스 상태와 Feign 호출을 함께 다시 받는다', async () => {
    const { user } = await openDashboard();
    await screen.findByText('4 / 5 정상');
    server.use(
      http.get(endpoint, ({ request }) => {
        const query = new URL(request.url).searchParams.get('query');
        return HttpResponse.json(
          prometheusResponse(query === PROMETHEUS_QUERIES.feign ? [] : PROMETHEUS_RESULTS[query]),
        );
      }),
    );
    await user.click(screen.getByRole('button', { name: '새로고침' }));
    expect(await within(flowRow('F6')).findByText('최근 호출 없음')).toBeInTheDocument();
    expect(screen.getByText('4 / 5 정상')).toBeInTheDocument();
  });
});
