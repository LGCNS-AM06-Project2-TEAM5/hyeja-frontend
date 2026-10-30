import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
  // 토큰, 조건 draft, 저장해 둔 검색 결과가 다음 테스트로 새지 않게 비운다.
  localStorage.clear();
  sessionStorage.clear();
});
