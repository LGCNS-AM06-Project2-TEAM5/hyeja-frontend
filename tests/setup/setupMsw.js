import { afterAll, afterEach, beforeAll } from 'vitest';

import './setupDom';
import { server } from '../msw/server';

// 핸들러가 없는 요청을 조용히 넘기지 않고 테스트를 실패시킨다.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// 테스트에서 server.use로 덮어쓴 예외 응답이 다음 테스트로 새지 않게 되돌린다.
afterEach(() => server.resetHandlers());

afterAll(() => server.close());
