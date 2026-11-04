import axios from 'axios';

const SERVICES = [
  ['gateway-service', 'gateway-service:8000'],
  ['user-service', 'user-service:8081'],
  ['policy-service', 'policy-service:8082'],
  ['engagement-service', 'engagement-service:8083'],
  ['recommendation-service', 'recommendation-service:8084'],
];
const QUERIES = {
  feign:
    'sum by (application, clientName, http_status_code, error) (increase(http_client_requests_seconds_count{clientName!=""}[5m]))',
  up: 'up{job="hyeja-services"}',
  rate: 'hyeja:http_requests:rate5m',
  latency: 'hyeja:http_latency_seconds:p95',
  errors: 'hyeja:http_5xx:ratio5m',
  requests:
    'sum by (spring_cloud_gateway_route_id, http_status_code) (increase(http_client_requests_seconds_count{application="gateway-service", spring_cloud_gateway_route_id!=""}[5m]))',
  // engagement가 직접 세는 값이다. listener 기본 지표는 재시도마다 실패가 늘어 DLT 건수와 다르다.
  policyEvents: 'sum by (result) (hyeja_policy_updated_events_total)',
  policyDlt: 'sum(hyeja_policy_updated_dlt_total)',
};
const FAILED = '불러오지 못했어요';
const MEASURING = '측정 중';

const queryPrometheus = async (baseUrl, query) => {
  // 서비스 JWT가 모니터링 서버로 전달되지 않도록 httpClient를 쓰지 않는다.
  const { data } = await axios.get(`${baseUrl.replace(/\/$/, '')}/api/v1/query`, {
    params: { query },
    timeout: 8000,
    withCredentials: false,
  });
  const result = data?.data?.result;
  if (
    data?.status !== 'success' ||
    data.data?.resultType !== 'vector' ||
    !Array.isArray(result) ||
    result.some((item) => !item.metric || !Array.isArray(item.value) || item.value.length !== 2)
  ) {
    throw new Error('모니터링 응답을 읽지 못했어요');
  }
  return result.map(({ metric, value }) => ({
    metric,
    value:
      typeof value[1] === 'string' &&
      value[1].trim() !== '' &&
      Number.isFinite(Number(value[1])) &&
      Number(value[1]) >= 0
        ? Number(value[1])
        : null,
  }));
};

/** null 쿼리는 실패, 빈 배열은 아직 표본이 없는 상태다. */
export const getServiceStatus = async () => {
  const baseUrl = import.meta.env.VITE_PROMETHEUS_URL?.trim();
  if (!baseUrl) return null;
  const entries = Object.entries(QUERIES);
  const results = await Promise.allSettled(
    entries.map(([, query]) => queryPrometheus(baseUrl, query)),
  );
  return Object.fromEntries(
    entries.map(([key], index) => [
      key,
      results[index].status === 'fulfilled' ? results[index].value : null,
    ]),
  );
};

export const toServiceRows = (metrics) =>
  SERVICES.map(([name, instance]) => {
    const value = (key) =>
      metrics?.[key]?.find(({ metric }) =>
        key === 'up' ? metric.instance === instance : metric.application === name,
      )?.value;
    const display = (key, format) =>
      metrics?.[key] === null
        ? FAILED
        : Number.isFinite(value(key))
          ? format(value(key))
          : MEASURING;
    return {
      name,
      status:
        metrics?.up === null
          ? FAILED
          : value('up') === 1
            ? '정상'
            : value('up') === 0
              ? '중단'
              : MEASURING,
      rate: display('rate', (number) => number.toFixed(1)),
      latency: display('latency', (number) => `${Math.round(number * 1000)}ms`),
      errors: display('errors', (number) => `${(number * 100).toFixed(1)}%`),
    };
  });

/** Gateway에서 받은 요청만 세어 내부 서비스 호출을 중복 집계하지 않는다. */
export const toGatewaySummary = (requests) => {
  if (requests === null) return [FAILED, FAILED];
  if (
    !requests?.length ||
    requests.some(
      ({ metric, value }) =>
        !Number.isFinite(value) ||
        typeof metric.http_status_code !== 'string' ||
        !/^[1-5]\d{2}$/.test(metric.http_status_code),
    )
  )
    return [MEASURING, MEASURING];
  const total = requests.reduce((sum, { value }) => sum + value, 0);
  const failed = requests.reduce(
    (sum, { metric, value }) => sum + (metric.http_status_code?.startsWith('5') ? value : 0),
    0,
  );
  return [
    `${Math.round(total).toLocaleString('ko-KR')}건`,
    `${(total > 0 ? (failed / total) * 100 : 0).toFixed(1)}%`,
  ];
};

const RECOMMENDATION_CLIENT = 'com.hyeja.recommendationservice';
const POLICY_CLIENT = 'com.hyeja.policyservice.client';
const CALL_FLOWS = [
  [
    'F1',
    'recommendation',
    'user',
    `${RECOMMENDATION_CLIENT}.profile.client.UserProfileFeignClient`,
  ],
  [
    'F2',
    'recommendation',
    'policy',
    `${RECOMMENDATION_CLIENT}.policy.client.PolicyCandidateFeignClient`,
  ],
  [
    'F3',
    'recommendation',
    'engagement',
    `${RECOMMENDATION_CLIENT}.favorite.client.FavoriteFeignClient`,
  ],
  ['F4', 'policy', 'engagement', `${POLICY_CLIENT}.engagement.EngagementClient`],
  ['F5', 'engagement', 'policy', null],
  ['F6', 'policy', 'user', `${POLICY_CLIENT}.user.UserClient`],
];

const isFailedCall = ({ metric, value }) => {
  if (value === 0) return false;
  const error = typeof metric.error === 'string' ? metric.error.trim() : '';
  if (/^5\d{2}$/.test(metric.http_status_code) || (error && error !== 'none')) return true;
  if (/^[1-4]\d{2}$/.test(metric.http_status_code) && error === 'none') return false;
  return null;
};

const formatCallCount = (count) =>
  count > 0 && count < 1 ? '1건 미만' : `${Math.round(count).toLocaleString('ko-KR')}건`;

/** 오류 라벨이 없는 호출을 성공으로 가정하지 않으며, 5xx와 연결 오류를 중복해서 세지 않는다. */
export const toFeignRows = (series) =>
  CALL_FLOWS.map(([id, source, target, clientName]) => {
    let calls = series === null ? FAILED : '불러오는 중…';
    let failures = calls;
    let hasFailures = false;
    if (!clientName) {
      calls = failures = '측정 전';
    } else if (Array.isArray(series)) {
      const samples = series.filter(
        ({ metric }) =>
          metric.application === `${source}-service` && metric.clientName === clientName,
      );
      const total = samples.reduce((sum, { value }) => sum + value, 0);
      if (samples.some(({ value }) => !Number.isFinite(value) || value < 0)) {
        calls = failures = MEASURING;
      } else if (!samples.length || total === 0) {
        calls = '최근 호출 없음';
        failures = '—';
      } else {
        calls = formatCallCount(total);
        const failed = samples.map(isFailedCall);
        const failureCount = failed.includes(null)
          ? null
          : samples.reduce((sum, { value }, index) => sum + (failed[index] ? value : 0), 0);
        failures = failureCount === null ? '측정 전' : formatCallCount(failureCount);
        hasFailures = failureCount > 0;
      }
    }
    return { id, source, target, calls, failures, hasFailures, p95: '측정 전' };
  });

const NOT_MEASURED = '측정 전';

const formatCount = (series, pick) => {
  if (series === null) return FAILED;
  const sample = Array.isArray(series) ? series.find(pick) : undefined;
  return Number.isFinite(sample?.value)
    ? `${Math.round(sample.value).toLocaleString('ko-KR')}건`
    : NOT_MEASURED;
};

/** engagement 시작 이후 누적값이다. 지표가 아직 없으면(이벤트를 한 번도 안 받았거나 재시작) 측정 전으로 둔다. */
export const toPolicyPipeline = (metrics) => {
  const dltSample = Array.isArray(metrics?.policyDlt) ? metrics.policyDlt[0] : undefined;

  return {
    applied: formatCount(metrics?.policyEvents, ({ metric }) => metric.result === 'applied'),
    duplicate: formatCount(metrics?.policyEvents, ({ metric }) => metric.result === 'duplicate'),
    dlt: formatCount(metrics?.policyDlt, () => true),
    hasDlt: Number.isFinite(dltSample?.value) && dltSample.value > 0,
  };
};

export const toResilienceRows = (metrics, events) => {
  const userUp = metrics?.up?.find(({ metric }) => metric.instance === 'user-service:8081')?.value;
  const pipeline = toPolicyPipeline(metrics);
  const pendingCount = events?.pendingCount;

  return [
    {
      situation: 'user 서비스 중단',
      response: '정책 화면은 비로그인 응답으로 계속 열려요 (연결 1초·응답 2초 제한)',
      now: userUp === 0 ? '대체 응답 중' : userUp === 1 ? '정상' : MEASURING,
      tone: userUp === 0 ? 'warning' : undefined,
    },
    {
      situation: 'Kafka 중단',
      response: '이벤트를 policy_outbox에 쌓아 두었다가 복구되면 이어서 보내요',
      now:
        events === null
          ? FAILED
          : events === undefined
            ? '불러오는 중…'
            : pendingCount === 0
              ? '정상'
              : Number.isFinite(pendingCount) && pendingCount >= 1
                ? `보내기 대기 ${pendingCount}건`
                : MEASURING,
      tone: Number.isFinite(pendingCount) && pendingCount >= 1 ? 'warning' : undefined,
    },
    {
      situation: '같은 이벤트가 두 번 옴',
      response: 'eventId로 한 번만 반영해요',
      now: `중복 무시 ${pipeline.duplicate}`,
      tone: undefined,
    },
    {
      situation: '처리할 수 없는 메시지',
      response: '1초 간격으로 3번 더 시도하고 안 되면 DLT로 따로 모아요',
      now: `DLT ${pipeline.dlt}`,
      tone: pipeline.hasDlt ? 'error' : undefined,
    },
  ];
};
