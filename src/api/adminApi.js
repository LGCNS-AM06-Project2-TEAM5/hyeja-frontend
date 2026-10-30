import { ENDPOINTS } from './endpoints';
import httpClient from './httpClient';

const unwrapResult = (response) => response?.result ?? response;

/** 정책마다 AI 분석을 거쳐 몇 분씩 걸릴 수 있어서, 이 요청만 기본 10초보다 오래 기다린다. */
const POLICY_SYNC_TIMEOUT_MS = 10 * 60 * 1000;

const POLICY_SYNC_STOPPED_CODE = 'POLICY_002';

/** 성공하면 백엔드가 "온통청년 주거 정책 N건 동기화가 완료되었습니다." 문구를 돌려준다. */
export const syncPolicies = async () =>
  unwrapResult(
    await httpClient.post(ENDPOINTS.ADMIN.POLICY_SYNC, null, { timeout: POLICY_SYNC_TIMEOUT_MS }),
  );

/** 502(POLICY_002)는 수집이 중간에 멈춘 경우다. 멈춘 페이지와 그때까지 저장한 건수를 꺼낸다. */
export const toPolicySyncStop = (error) => {
  const data = error?.response?.data;

  if (data?.code !== POLICY_SYNC_STOPPED_CODE) {
    return null;
  }

  return {
    message: data.message ?? '',
    stoppedPage: data.result?.stoppedPage ?? null,
    savedCount: data.result?.savedCount ?? null,
  };
};
