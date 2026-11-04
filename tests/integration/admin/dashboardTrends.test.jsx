import { act, screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ROUTES } from '@/constants/routes';
import { TREND_QUERIES } from '@/api/prometheusApi';

import { renderApp, signInAs } from '../../helpers/renderApp';
import { TOKENS, PROMETHEUS_TRENDS, prometheusRangeResponse } from '../../msw/fixtures';
import { server } from '../../msw/server';

const endpoint = 'http://monitoring.test/api/v1/query_range';
const openDashboard = async () => {
  signInAs(TOKENS.ADMIN);
  const view = renderApp(ROUTES.ADMIN);
  await screen.findByRole('heading', { name: '관리 · 운영 현황' }, { timeout: 2000 });
  return view;
};
beforeEach(() => vi.stubEnv('VITE_PROMETHEUS_URL', 'http://monitoring.test'));
afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe('운영 현황 추이 그래프', () => {
  it('그래프 세 개와 현재 값, 최대값을 보여 준다', async () => {
    await openDashboard();
    for (const title of ['요청 수 (Gateway)', '응답 시간 p95', '5xx 비율']) {
      expect(
        await screen.findByRole('img', { name: `${title} 최근 15분 추이` }),
      ).toBeInTheDocument();
    }
    const card = within(screen.getByRole('region', { name: '요청 수 (Gateway)' }));
    expect(card.getByText('1.5회/초')).toBeInTheDocument();
    expect(card.getByText('최대 2.0회/초')).toBeInTheDocument();
    expect(screen.getByText('123ms')).toBeInTheDocument();
    expect(screen.getByText('1.5%')).toBeInTheDocument();
  });

  it('실패한 추이 카드만 오류를 표시하고 나머지 화면은 유지한다', async () => {
    server.use(
      http.get(endpoint, ({ request }) => {
        const query = new URL(request.url).searchParams.get('query');
        return query === TREND_QUERIES.latency
          ? HttpResponse.json({}, { status: 503 })
          : HttpResponse.json(prometheusRangeResponse(PROMETHEUS_TRENDS[query]));
      }),
    );
    await openDashboard();
    expect(
      await within(screen.getByRole('region', { name: '응답 시간 p95' })).findByText(
        '불러오지 못했어요',
      ),
    ).toBeInTheDocument();
    expect(await screen.findByText('1.5회/초')).toBeInTheDocument();
    expect(await screen.findByText('4 / 5 정상')).toBeInTheDocument();
  });

  it('추이가 늦어도 기존 요약을 표시하고 새로고침과 15초 갱신에 따라간다', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    let release;
    const gate = new Promise((resolve) => {
      release = resolve;
    });
    const requests = vi.fn();
    server.use(
      http.get(endpoint, async ({ request }) => {
        requests();
        await gate;
        return HttpResponse.json(
          prometheusRangeResponse(
            PROMETHEUS_TRENDS[new URL(request.url).searchParams.get('query')],
          ),
        );
      }),
    );
    const view = await openDashboard();
    try {
      expect(await screen.findByText('4 / 5 정상')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '새로고침' })).toBeEnabled();
    } finally {
      release();
    }
    await screen.findByText('1.5회/초');
    expect(requests).toHaveBeenCalledTimes(3);
    await view.user.click(screen.getByRole('button', { name: '새로고침' }));
    await waitFor(() => expect(requests).toHaveBeenCalledTimes(6));
    await act(() => vi.advanceTimersByTimeAsync(15000));
    await waitFor(() => expect(requests).toHaveBeenCalledTimes(9));
    view.unmount();
    await act(() => vi.advanceTimersByTimeAsync(15000));
    expect(requests).toHaveBeenCalledTimes(9);
  });
});
