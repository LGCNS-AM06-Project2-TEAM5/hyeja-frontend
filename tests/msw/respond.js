import { HttpResponse } from 'msw';

/**
 * 통합 테스트의 가짜 서버 응답을 만드는 유일한 곳.
 *
 * notice: 지금 프론트(httpClient)는 응답 본문을 그대로 데이터로 쓴다는 가정으로 만들었다.
 * notice: 실제 백엔드는 { isSuccess, code, message, result }로 감싸서 준다.
 *         응답 봉투가 확정되면 httpClient 인터셉터와 함께 이 파일의 ok/fail만 바꾼다.
 *         테스트 본문은 ok(data)/fail(status, message)만 쓰므로 바뀌지 않는다.
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/** ENDPOINTS의 상대 경로를 MSW가 매칭할 절대 URL로 바꾼다. */
export const apiUrl = (path) => `${API_BASE_URL}${path}`;

export const ok = (data = {}) => HttpResponse.json(data);

export const fail = (status, message) => HttpResponse.json({ message }, { status });
