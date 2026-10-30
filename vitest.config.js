import { defineConfig, mergeConfig } from 'vitest/config';

import viteConfig from './vite.config.js';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      // notice: .env.* 파일은 gitignore 대상이라 CI에 없다. 테스트에서 쓸 값을 여기서 고정한다.
      // notice: baseURL이 있어야 MSW가 절대 URL로 요청을 가로챌 수 있다. 목 어댑터는 끈다.
      // notice: CI(UTC)와 로컬(KST)의 날짜 계산이 갈리지 않게 서비스 기준 시간대로 고정한다.
      env: {
        VITE_API_BASE_URL: 'http://localhost',
        VITE_USE_MOCK: 'false',
        TZ: 'Asia/Seoul',
      },
      setupFiles: ['./tests/setup/setupDom.js'],
      restoreMocks: true,
      coverage: {
        provider: 'v8',
        include: ['src/**/*.{js,jsx}'],
        // notice: src/mocks는 데모용 가짜 백엔드라 제품 코드 커버리지에서 뺀다.
        exclude: ['src/mocks/**', 'src/main.jsx'],
        reporter: ['text-summary', 'html', 'json-summary'],
      },
      // notice: Vitest 5부터 인라인 프로젝트는 위 루트 설정을 기본으로 상속한다(extends: true).
      // notice: 그래서 MSW setup은 루트가 아니라 integration 프로젝트에만 둔다.
      projects: [
        {
          extends: true,
          test: {
            name: 'unit',
            include: ['tests/unit/**/*.test.{js,jsx}'],
          },
        },
        {
          extends: true,
          test: {
            name: 'integration',
            include: ['tests/integration/**/*.test.{js,jsx}'],
            setupFiles: ['./tests/setup/setupMsw.js'],
          },
        },
      ],
    },
  }),
);
