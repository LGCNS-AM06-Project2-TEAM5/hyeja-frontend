import axios from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { getServiceStatus, toGatewaySummary, toServiceRows } from '@/api/prometheusApi';

vi.mock('axios', () => ({ default: { get: vi.fn() } }));
afterEach(() => {
  vi.resetAllMocks();
  vi.unstubAllEnvs();
});

describe('운영 지표 변환', () => {
  it('up은 instance, 나머지는 application으로 연결하고 0과 결측을 구분한다', () => {
    const [gateway, user] = toServiceRows({
      up: [{ metric: { instance: 'gateway-service:8000' }, value: 0 }],
      rate: [{ metric: { application: 'gateway-service' }, value: 0 }],
      latency: [{ metric: { application: 'gateway-service' }, value: 0.125 }],
      errors: [{ metric: { application: 'gateway-service' }, value: 0.01 }],
    });
    expect(gateway).toMatchObject({
      name: 'gateway-service',
      status: '중단',
      rate: '0.0',
      latency: '125ms',
      errors: '1.0%',
    });
    expect(user).toMatchObject({ name: 'user-service', status: '측정 중', rate: '측정 중' });
  });

  it('쿼리 실패와 유효하지 않은 숫자를 정상이나 0으로 표시하지 않는다', () => {
    expect(
      toServiceRows({
        up: null,
        rate: [],
        latency: null,
        errors: [{ metric: { application: 'policy-service' }, value: null }],
      })[2],
    ).toMatchObject({
      status: '불러오지 못했어요',
      rate: '측정 중',
      latency: '불러오지 못했어요',
      errors: '측정 중',
    });
  });

  it('Gateway 경로별 요청으로 전체 요청과 5xx 비율을 계산한다', () => {
    expect(
      toGatewaySummary([
        { metric: { http_status_code: '200' }, value: 98 },
        { metric: { http_status_code: '503' }, value: 2 },
      ]),
    ).toEqual(['100건', '2.0%']);
  });

  it('실제 0건과 빈 결과, 실패, 유효하지 않은 표본을 구분한다', () => {
    expect(toGatewaySummary([{ metric: { http_status_code: '200' }, value: 0 }])).toEqual([
      '0건',
      '0.0%',
    ]);
    expect(toGatewaySummary([])).toEqual(['측정 중', '측정 중']);
    expect(toGatewaySummary([{ metric: {}, value: 5 }])).toEqual(['측정 중', '측정 중']);
    expect(toGatewaySummary(null)).toEqual(['불러오지 못했어요', '불러오지 못했어요']);
    expect(toGatewaySummary([{ metric: { http_status_code: '200' }, value: null }])).toEqual([
      '측정 중',
      '측정 중',
    ]);
  });
});

describe('Prometheus 조회', () => {
  it('설정이 없으면 요청하지 않는다', async () => {
    vi.stubEnv('VITE_PROMETHEUS_URL', '  ');
    expect(await getServiceStatus()).toBeNull();
    expect(axios.get).not.toHaveBeenCalled();
  });

  it('인증 헤더 없이 제한 시간을 두고 문자열 숫자를 변환한다', async () => {
    vi.stubEnv('VITE_PROMETHEUS_URL', 'http://monitoring.test/');
    axios.get.mockResolvedValue({
      data: {
        status: 'success',
        data: {
          resultType: 'vector',
          result: [{ metric: { application: 'policy-service' }, value: [1, '0.061'] }],
        },
      },
    });
    const status = await getServiceStatus();
    expect(status.latency[0].value).toBe(0.061);
    expect(axios.get).toHaveBeenCalledTimes(5);
    expect(axios.get).toHaveBeenCalledWith('http://monitoring.test/api/v1/query', {
      params: { query: 'up{job="hyeja-services"}' },
      timeout: 8000,
      withCredentials: false,
    });
  });

  it.each(['NaN', '+Inf', '-Inf', '', ' ', null, undefined, '-1'])(
    '유효하지 않은 표본 %s는 결측으로 보존한다',
    async (value) => {
      vi.stubEnv('VITE_PROMETHEUS_URL', 'http://monitoring.test');
      axios.get.mockResolvedValue({
        data: {
          status: 'success',
          data: { resultType: 'vector', result: [{ metric: {}, value: [1, value] }] },
        },
      });
      expect((await getServiceStatus()).latency[0].value).toBeNull();
    },
  );

  it('한 요청이 실패해도 다른 요청 결과는 남긴다', async () => {
    vi.stubEnv('VITE_PROMETHEUS_URL', 'http://monitoring.test');
    axios.get.mockImplementation((_url, { params }) =>
      params.query === 'hyeja:http_latency_seconds:p95'
        ? Promise.reject(new Error('timeout'))
        : Promise.resolve({
            data: { status: 'success', data: { resultType: 'vector', result: [] } },
          }),
    );
    expect(await getServiceStatus()).toMatchObject({
      up: [],
      rate: [],
      latency: null,
      errors: [],
      requests: [],
    });
  });

  it.each([
    { status: 'error' },
    { status: 'success', data: { resultType: 'matrix', result: [] } },
    { status: 'success', data: { resultType: 'vector', result: [{}] } },
  ])('잘못된 응답은 조회 실패로 처리한다', async (data) => {
    vi.stubEnv('VITE_PROMETHEUS_URL', 'http://monitoring.test');
    axios.get.mockResolvedValue({ data });
    expect((await getServiceStatus()).up).toBeNull();
  });
});
