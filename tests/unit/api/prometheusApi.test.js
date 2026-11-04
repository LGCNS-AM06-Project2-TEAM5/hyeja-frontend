import axios from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  getServiceStatus,
  toGatewaySummary,
  toServiceRows,
  toFeignRows,
  toPolicyPipeline,
  toResilienceRows,
  toCircuitRows,
} from '@/api/prometheusApi';

vi.mock('axios', () => ({ default: { get: vi.fn() } }));
afterEach(() => {
  vi.resetAllMocks();
  vi.unstubAllEnvs();
});

describe('장애 대응 시나리오', () => {
  const metrics = (up) => ({
    up: [{ metric: { instance: 'user-service:8081' }, value: up }],
    policyEvents: [{ metric: { result: 'duplicate' }, value: 3 }],
    policyDlt: [{ metric: {}, value: 1 }],
  });

  it('user 중단이면 대체 응답, up 1이면 정상으로 표시한다', () => {
    expect(toResilienceRows(metrics(0), { pendingCount: 0 })[0]).toMatchObject({
      now: '대체 응답 중',
      tone: 'warning',
    });
    expect(toResilienceRows(metrics(1), { pendingCount: 0 })[0]).toMatchObject({
      now: '정상',
      tone: undefined,
    });
  });

  it('보내기 대기와 정상, 조회 실패, 초기 로딩을 구분한다', () => {
    expect(toResilienceRows({}, { pendingCount: 2 })[1]).toMatchObject({
      now: '보내기 대기 2건',
      tone: 'warning',
    });
    expect(toResilienceRows({}, { pendingCount: 0 })[1]).toMatchObject({
      now: '정상',
      tone: undefined,
    });
    expect(toResilienceRows({}, null)[1].now).toBe('불러오지 못했어요');
    expect(toResilienceRows({}, undefined)[1].now).toBe('불러오는 중…');
  });

  it('중복과 실제 DLT 건수를 쓰고 DLT가 있으면 오류로 표시한다', () => {
    const rows = toResilienceRows(metrics(1), { pendingCount: 0 });
    expect(rows[2]).toMatchObject({ now: '중복 무시 3건', tone: undefined });
    expect(rows[3]).toMatchObject({ now: 'DLT 1건', tone: 'error' });
  });

  it('빈 지표와 알 수 없는 up을 정상이나 0건으로 바꾸지 않는다', () => {
    const rows = toResilienceRows({ up: [], policyEvents: [], policyDlt: [] });
    expect(rows).toHaveLength(4);
    expect(rows[0].now).toBe('측정 중');
    expect(rows[2].now).toBe('중복 무시 측정 전');
    expect(rows[3]).toMatchObject({ now: 'DLT 측정 전', tone: undefined });
    expect(toResilienceRows(metrics(null))[0].now).toBe('측정 중');
  });
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
    expect(axios.get).toHaveBeenCalledTimes(11);
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

describe('서비스 간 호출 집계', () => {
  const sample = (
    http_status_code,
    error,
    value = 1,
    application = 'policy-service',
    clientName = 'com.hyeja.policyservice.client.user.UserClient',
  ) => ({
    metric: {
      application,
      clientName,
      http_status_code,
      ...(error === undefined ? {} : { error }),
    },
    value,
  });
  const f6 = (data) => toFeignRows(data).find(({ id }) => id === 'F6');

  it('5xx와 오류 라벨을 중복 없이 세고 4xx는 문서 기준대로 처리한다', () => {
    expect(
      f6([
        sample('200', 'none', 12),
        sample('503', 'RetryableException', 3),
        sample('-1', 'RetryableException', 2),
        sample('404', 'none', 2),
      ]),
    ).toMatchObject({ calls: '19건', failures: '5건', p95: '측정 전' });
  });

  it('양수인 추정 건수를 반올림해 0건으로 표시하지 않는다', () => {
    expect(f6([sample('503', 'none', 0.2)])).toMatchObject({
      calls: '1건 미만',
      failures: '1건 미만',
      hasFailures: true,
    });
    expect(f6([sample('200', 'none', 4)])).toMatchObject({ failures: '0건', hasFailures: false });
  });

  it('오류 라벨이 없으면 실패 0건으로 단정하지 않는다', () => {
    expect(f6([sample('200', undefined, 5)])).toMatchObject({ calls: '5건', failures: '측정 전' });
    expect(f6([sample('503', undefined, 2)])).toMatchObject({ calls: '2건', failures: '2건' });
    expect(f6([sample('503', 'none', 2), sample('200', undefined, 5)]).failures).toBe('측정 전');
  });

  it('서비스와 클라이언트 전체 이름이 모두 맞는 표본만 더한다', () => {
    expect(
      f6([
        sample('200', 'none', 4),
        sample('200', 'none', 90, 'recommendation-service'),
        sample('200', 'none', 80, 'policy-service', 'other.UserClient'),
      ]).calls,
    ).toBe('4건');
    const flows = toFeignRows([]);
    expect(flows.map(({ id }) => id)).toEqual(['F1', 'F2', 'F3', 'F4', 'F5', 'F6']);
    expect(flows.find(({ id }) => id === 'F3')).toMatchObject({
      source: 'recommendation',
      target: 'engagement',
    });
    expect(flows.find(({ id }) => id === 'F4')).toMatchObject({
      source: 'policy',
      target: 'engagement',
    });
  });

  it.each([{ samples: [] }, { samples: [sample('200', 'none', 0)] }])(
    '빈 결과와 실제 0건은 최근 호출 없음으로 표시한다',
    ({ samples }) => {
      expect(f6(samples)).toMatchObject({ calls: '최근 호출 없음', failures: '—' });
    },
  );

  it.each([null, NaN, Infinity, -1])('잘못된 숫자 %s는 0건으로 바꾸지 않는다', (value) => {
    expect(f6([sample('200', 'none', value)])).toMatchObject({
      calls: '측정 중',
      failures: '측정 중',
    });
  });

  it('조회 실패·초기 로딩을 구분하고 F5는 측정 전으로 남긴다', () => {
    expect(f6(null)).toMatchObject({ calls: '불러오지 못했어요', failures: '불러오지 못했어요' });
    expect(f6(undefined).calls).toBe('불러오는 중…');
    expect(toFeignRows(null).find(({ id }) => id === 'F5')).toMatchObject({
      calls: '측정 전',
      failures: '측정 전',
      p95: '측정 전',
    });
  });

  it.each([
    ['', 'none'],
    ['200', ''],
    ['200', ' '],
    [undefined, undefined],
  ])('상태·오류 정보가 불완전하면 실패 수를 측정 전으로 표시한다', (status, error) => {
    expect(f6([sample(status, error, 5)]).failures).toBe('측정 전');
  });
});

describe('policy-updated 처리 건수', () => {
  it('반영·중복 무시·DLT를 각각 보여 주고 0건은 0건으로 둔다', () => {
    expect(
      toPolicyPipeline({
        policyEvents: [
          { metric: { result: 'applied' }, value: 12 },
          { metric: { result: 'duplicate' }, value: 0 },
        ],
        policyDlt: [{ metric: {}, value: 1 }],
      }),
    ).toEqual({ applied: '12건', duplicate: '0건', dlt: '1건', hasDlt: true });
  });

  it('지표가 아직 없으면 측정 전, 조회가 실패하면 불러오지 못했어요로 구분한다', () => {
    expect(toPolicyPipeline({ policyEvents: [], policyDlt: [] })).toEqual({
      applied: '측정 전',
      duplicate: '측정 전',
      dlt: '측정 전',
      hasDlt: false,
    });
    expect(toPolicyPipeline({ policyEvents: null, policyDlt: null })).toEqual({
      applied: '불러오지 못했어요',
      duplicate: '불러오지 못했어요',
      dlt: '불러오지 못했어요',
      hasDlt: false,
    });
    expect(toPolicyPipeline(null).applied).toBe('측정 전');
  });
});

describe('서킷 브레이커와 JVM 힙', () => {
  const circuit = (state, value = 1, name = 'recUserProfile') => ({
    metric: { name, state },
    value,
  });

  it.each([
    ['closed', '정상', 'success'],
    ['open', '차단', 'error'],
    ['half_open', '확인 중', 'warning'],
    ['disabled', 'DISABLED', 'default'],
  ])('%s 중 값이 1인 상태만 표시한다', (state, status, tone) => {
    expect(toCircuitRows({ circuit: [circuit('unselected', 0), circuit(state)] })[0]).toMatchObject(
      { id: 'F1', source: 'recommendation', target: 'user', status, tone },
    );
  });

  it('지정된 여섯 호출 순서를 유지하고 지표가 없는 이름은 측정 전이다', () => {
    const rows = toCircuitRows({ circuit: [circuit('closed')] });
    expect(rows.map(({ id }) => id)).toEqual(['F1', 'F2', 'F3', 'F4', 'F5', 'F6']);
    expect(rows[4]).toMatchObject({
      name: 'engPolicySnapshot',
      source: 'engagement',
      target: 'policy',
      status: '측정 전',
    });
    expect(toCircuitRows({ circuit: [] }).every(({ status }) => status === '측정 전')).toBe(true);
  });

  it('circuit 쿼리 실패는 모든 행에 조회 실패로 표시한다', () => {
    expect(
      toCircuitRows({ circuit: null }).every(({ status }) => status === '불러오지 못했어요'),
    ).toBe(true);
  });

  it.each([
    [-1, '표본 부족'],
    [null, '표본 부족'],
    [12.6, '13%'],
    [0, '0%'],
  ])('실패율 %s를 %s로 표시한다', (value, failureRate) => {
    expect(
      toCircuitRows({ circuitFailure: [{ metric: { name: 'recUserProfile' }, value }] })[0]
        .failureRate,
    ).toBe(failureRate);
  });

  it('heap은 application 대신 instance로 연결해 MB 정수로 표시한다', () => {
    const rows = toServiceRows({
      heap: [
        {
          metric: { instance: 'policy-service:8082', application: 'user-service' },
          value: 512 * 1024 * 1024,
        },
        { metric: { instance: 'gateway-service:8000' }, value: 0 },
      ],
    });
    expect(rows[2].heap).toBe('512MB');
    expect(rows[0].heap).toBe('0MB');
    expect(rows[1].heap).toBe('측정 중');
    expect(toServiceRows({ heap: null }).every(({ heap }) => heap === '불러오지 못했어요')).toBe(
      true,
    );
  });
});
