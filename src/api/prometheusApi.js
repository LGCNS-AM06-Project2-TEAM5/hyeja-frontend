import axios from 'axios';

const SERVICES = [
  ['gateway-service', 'gateway-service:8000'],
  ['user-service', 'user-service:8081'],
  ['policy-service', 'policy-service:8082'],
  ['engagement-service', 'engagement-service:8083'],
  ['recommendation-service', 'recommendation-service:8084'],
];
const QUERIES = {
  up: 'up{job="hyeja-services"}',
  rate: 'hyeja:http_requests:rate5m',
  latency: 'hyeja:http_latency_seconds:p95',
  errors: 'hyeja:http_5xx:ratio5m',
  requests:
    'sum by (spring_cloud_gateway_route_id, http_status_code) (increase(http_client_requests_seconds_count{application="gateway-service", spring_cloud_gateway_route_id!=""}[5m]))',
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
