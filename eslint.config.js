import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  // ESLint는 .gitignore를 읽지 않으니 빌드·테스트 산출물을 여기서도 뺀다.
  globalIgnores(['dist', 'dist-e2e', 'coverage', 'playwright-report', 'test-results']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  {
    // 설정 파일과 E2E는 Node에서 실행된다.
    files: ['*.config.js', 'tests/e2e/**/*.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
]);
