import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  // 재시도로 통과한 테스트는 리포트에 flaky로 남는다. 원인을 찾아 고친다.
  retries: isCI ? 2 : 0,
  reporter: isCI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  /**
   * notice: 지금 E2E는 실제 백엔드 없이 "목 모드 빌드"로 돈다.
   *         VITE_USE_MOCK=true로 빌드하면 앱 안의 가짜 백엔드(src/mocks)가 모든 API에 응답한다.
   *         배포용 dist와 섞이지 않게 dist-e2e로 따로 빌드한다.
   * notice: 백엔드가 배포되면 같은 spec을 E2E_BASE_URL로 실서버에 돌린다(README "테스트" 참고).
   *         그때는 webServer 없이 baseURL만 바꾸고, PR마다가 아니라 수동·야간 워크플로로 분리한다.
   */
  webServer: {
    command: `npx vite build --outDir dist-e2e --emptyOutDir && npx vite preview --outDir dist-e2e --port ${PORT} --strictPort`,
    env: { VITE_USE_MOCK: 'true' },
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !isCI,
    timeout: 120_000,
  },
});
