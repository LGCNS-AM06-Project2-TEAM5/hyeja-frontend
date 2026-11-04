import axios from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  getServiceTrends,
  queryPrometheusRange,
  toTrendSummary,
  TREND_QUERIES,
} from '@/api/prometheusApi';

vi.mock('axios', () => ({ default: { get: vi.fn() } }));
afterEach(() => {
  vi.resetAllMocks();
  vi.unstubAllEnvs();
});
const matrix = (values) => ({
  data: { status: 'success', data: { resultType: 'matrix', result: [{ metric: {}, values }] } },
});

describe('최근 15분 추이', () => {
  it('matrix의 시각과 숫자를 변환하고 인증 없이 범위 조회한다', async () => {
    axios.get.mockResolvedValue(
      matrix([
        [100, '1.25'],
        [130, '0'],
      ]),
    );
    expect(
      await queryPrometheusRange('http://monitoring.test/', 'rate', {
        start: 100,
        end: 130,
        step: 30,
      }),
    ).toEqual([
      {
        metric: {},
        values: [
          { t: 100, v: 1.25 },
          { t: 130, v: 0 },
        ],
      },
    ]);
    expect(axios.get).toHaveBeenCalledWith('http://monitoring.test/api/v1/query_range', {
      params: { query: 'rate', start: 100, end: 130, step: 30 },
      timeout: 8000,
      withCredentials: false,
    });
  });

  it('matrix가 아닌 응답은 거절한다', async () => {
    axios.get.mockResolvedValue({
      data: { status: 'success', data: { resultType: 'vector', result: [] } },
    });
    await expect(queryPrometheusRange('http://monitoring.test', 'rate', {})).rejects.toThrow();
  });

  it('음수와 숫자가 아닌 표본은 선을 끊을 수 있게 null로 둔다', async () => {
    axios.get.mockResolvedValue(
      matrix([
        [1, '-1'],
        [2, 'NaN'],
        [3, ''],
        [4, null],
        [5, '+Inf'],
      ]),
    );
    const [series] = await queryPrometheusRange('http://monitoring.test', 'rate', {});
    expect(series.values.map(({ v }) => v)).toEqual([null, null, null, null, null]);
  });

  it.each([
    ['rate', 1.25, '1.3회/초', '2.5회/초'],
    ['latency', 0.123, '123ms', '246ms'],
    ['errors', 0.025, '2.5%', '5.0%'],
  ])('%s의 마지막 값과 최대값에 단위를 붙인다', (kind, value, current, max) => {
    expect(
      toTrendSummary(
        [
          { t: 1, v: value * 2 },
          { t: 2, v: value },
        ],
        kind,
      ),
    ).toEqual({ current, max });
  });

  it('빈 배열과 결측은 측정 중이며 마지막 결측을 과거 값으로 바꾸지 않는다', () => {
    expect(toTrendSummary([], 'rate')).toEqual({ current: '측정 중', max: '측정 중' });
    expect(toTrendSummary(null, 'rate')).toEqual({ current: '측정 중', max: '측정 중' });
    expect(
      toTrendSummary(
        [
          { t: 1, v: 1 },
          { t: 2, v: null },
        ],
        'rate',
      ),
    ).toEqual({ current: '측정 중', max: '1.0회/초' });
  });

  it('주소가 없으면 요청하지 않는다', async () => {
    vi.stubEnv('VITE_PROMETHEUS_URL', ' ');
    expect(await getServiceTrends()).toBeNull();
    expect(axios.get).not.toHaveBeenCalled();
  });

  it('최근 15분을 30초 간격으로 조회하고 실패한 키만 null로 둔다', async () => {
    vi.stubEnv('VITE_PROMETHEUS_URL', 'http://monitoring.test');
    axios.get.mockImplementation((_url, { params }) =>
      params.query === TREND_QUERIES.latency
        ? Promise.reject(new Error('timeout'))
        : params.query === TREND_QUERIES.errors
          ? Promise.resolve({
              data: { status: 'success', data: { resultType: 'matrix', result: [] } },
            })
          : Promise.resolve(matrix([[1800, '2']])),
    );
    expect(await getServiceTrends(1800000)).toEqual({
      rate: [{ t: 1800, v: 2 }],
      latency: null,
      errors: [],
    });
    expect(axios.get).toHaveBeenCalledTimes(3);
    expect(axios.get.mock.calls[0][1].params).toMatchObject({ start: 900, end: 1800, step: 30 });
  });
});
