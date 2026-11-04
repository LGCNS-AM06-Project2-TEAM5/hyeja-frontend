import { act, screen, waitFor, within } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ENDPOINTS } from '@/api/endpoints';
import { ROUTES } from '@/constants/routes';

import { renderApp, signInAs } from '../../helpers/renderApp';
import {
  POLICY_EVENT_STATUS_RESPONSE,
  PROMETHEUS_QUERIES,
  PROMETHEUS_RESULTS,
  TOKENS,
  prometheusResponse,
} from '../../msw/fixtures';
import { apiUrl } from '../../msw/respond';
import { server } from '../../msw/server';

const endpoint = 'http://monitoring.test/api/v1/query';
const openDashboard = async () => {
  signInAs(TOKENS.ADMIN);
  const view = renderApp(ROUTES.ADMIN);
  await screen.findByRole('heading', { name: '관리 · 운영 현황' }, { timeout: 2000 });
  return view;
};
const serviceTable = () => within(screen.getByRole('table', { name: '서비스 상태' }));
const policyRow = () => serviceTable().getByRole('row', { name: /policy-service/ });

beforeEach(() => vi.stubEnv('VITE_PROMETHEUS_URL', 'http://monitoring.test'));
afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe('관리자 운영 현황', () => {
  it('서비스 상태 표의 5xx 비율 다음에 JVM 힙을 표시한다', async () => {
    await openDashboard();
    await screen.findByText('4 / 5 정상');
    expect(
      serviceTable()
        .getAllByRole('columnheader')
        .map((cell) => cell.textContent),
    ).toEqual(['서비스', '상태', '초당 요청', '응답 시간 p95', '5xx 비율', 'JVM 힙']);
    expect(within(policyRow()).getByText('512MB')).toBeInTheDocument();
  });
  it('서비스 상태와 단위 변환, Gateway 요약, 이벤트 대기를 보여 준다', async () => {
    await openDashboard();
    expect(await screen.findByText('4 / 5 정상')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '운영 현황' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('100건')).toBeInTheDocument();
    expect(screen.getByText('2.0%')).toBeInTheDocument();
    expect(screen.getByText('1건')).toBeInTheDocument();
    const row = within(policyRow());
    expect(row.getByText('정상')).toBeInTheDocument();
    expect(row.getByText('2.1')).toBeInTheDocument();
    expect(row.getByText('61ms')).toBeInTheDocument();
    expect(row.getByText('2.5%')).toBeInTheDocument();
    expect(
      within(serviceTable().getByRole('row', { name: /user-service/ })).getByText('중단'),
    ).toBeInTheDocument();
  });

  it('주소가 없으면 Prometheus로 요청하지 않고 설정 안내를 보여 준다', async () => {
    vi.stubEnv('VITE_PROMETHEUS_URL', '');
    const request = vi.fn(() => HttpResponse.error());
    server.use(http.get(endpoint, request));
    await openDashboard();
    expect(await screen.findByText('모니터링 주소가 설정되지 않았어요')).toBeInTheDocument();
    expect(request).not.toHaveBeenCalled();
    expect(await screen.findByText('1건')).toBeInTheDocument();
  });

  it('이벤트 API가 느려도 서비스 상태를 먼저 표시한다', async () => {
    let release;
    const gate = new Promise((resolve) => {
      release = resolve;
    });
    server.use(
      http.get(apiUrl(ENDPOINTS.ADMIN.POLICY_EVENTS), async () => {
        await gate;
        return HttpResponse.json(POLICY_EVENT_STATUS_RESPONSE);
      }),
    );
    try {
      await openDashboard();
      expect(await screen.findByText('4 / 5 정상')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '새로고침' })).toBeEnabled();
      expect(screen.queryByText('1건')).not.toBeInTheDocument();
    } finally {
      release();
    }
    expect(await screen.findByText('1건')).toBeInTheDocument();
  });

  it('Prometheus가 느려도 이벤트 대기 건수를 먼저 표시한다', async () => {
    let release;
    const gate = new Promise((resolve) => {
      release = resolve;
    });
    server.use(
      http.get(endpoint, async ({ request }) => {
        await gate;
        const query = new URL(request.url).searchParams.get('query');
        return HttpResponse.json(prometheusResponse(PROMETHEUS_RESULTS[query]));
      }),
    );
    try {
      await openDashboard();
      expect(await screen.findByText('1건')).toBeInTheDocument();
      expect(screen.queryByText('4 / 5 정상')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: '새로고침' })).toBeDisabled();
    } finally {
      release();
    }
    expect(await screen.findByText('4 / 5 정상')).toBeInTheDocument();
  });

  it('실패한 지표만 오류로 표시하고 빈 결과는 측정 중으로 표시한다', async () => {
    server.use(
      http.get(endpoint, ({ request }) => {
        const query = new URL(request.url).searchParams.get('query');
        if (query === PROMETHEUS_QUERIES.latency) return HttpResponse.json({}, { status: 503 });
        return HttpResponse.json(
          prometheusResponse(query === PROMETHEUS_QUERIES.rate ? [] : PROMETHEUS_RESULTS[query]),
        );
      }),
    );
    await openDashboard();
    await screen.findByText('4 / 5 정상');
    expect(within(policyRow()).getByText('정상')).toBeInTheDocument();
    expect(within(policyRow()).getByText('측정 중')).toBeInTheDocument();
    expect(within(policyRow()).getByText('불러오지 못했어요')).toBeInTheDocument();
    expect(within(policyRow()).getByText('2.5%')).toBeInTheDocument();
  });

  it('새로고침으로 중단 상태를 반영하고 요청 중에는 버튼을 잠근다', async () => {
    const { user } = await openDashboard();
    await screen.findByText('4 / 5 정상');
    let complete;
    server.use(
      http.get(endpoint, async ({ request }) => {
        const query = new URL(request.url).searchParams.get('query');
        if (query === PROMETHEUS_QUERIES.up) {
          await new Promise((resolve) => {
            complete = resolve;
          });
          return HttpResponse.json(prometheusResponse([]));
        }
        return HttpResponse.json(prometheusResponse(PROMETHEUS_RESULTS[query]));
      }),
    );
    const button = screen.getByRole('button', { name: '새로고침' });
    await user.click(button);
    expect(button).toBeDisabled();
    await waitFor(() => expect(complete).toBeTypeOf('function'));
    complete();
    await waitFor(() => expect(button).toBeEnabled());
    expect(within(policyRow()).getAllByText('측정 중').length).toBeGreaterThan(0);
    expect(screen.queryByText('4 / 5 정상')).not.toBeInTheDocument();
  });

  it('15초마다 조회하고 화면을 떠나면 자동 갱신을 멈춘다', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    const queries = vi.fn();
    server.use(
      http.get(endpoint, ({ request }) => {
        const query = new URL(request.url).searchParams.get('query');
        queries(query);
        return HttpResponse.json(prometheusResponse(PROMETHEUS_RESULTS[query]));
      }),
    );
    const view = await openDashboard();
    await screen.findByText('4 / 5 정상');
    expect(queries).toHaveBeenCalledTimes(11);
    await act(() => vi.advanceTimersByTimeAsync(15000));
    await waitFor(() => expect(queries).toHaveBeenCalledTimes(22));
    view.unmount();
    await act(() => vi.advanceTimersByTimeAsync(15000));
    expect(queries).toHaveBeenCalledTimes(22);
  });
});
