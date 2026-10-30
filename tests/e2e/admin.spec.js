/**
 * E-5 역할별 접근: 관리자만 정책 수집 화면을 쓴다
 *
 * notice: 목 모드 빌드에서 돈다. 관리자 판별은 프론트 가정값(role === 'ADMIN')이고,
 *         수집 실행(POST /api/policies/sync)은 목 서버가 즉시 성공 문구를 돌려준다.
 *         실서버는 정책마다 OpenAI 분석을 호출해 몇 분씩 걸리고 비용이 들므로 E2E로 돌리지 않는다.
 */
import { expect, test } from '@playwright/test';

import { ADMIN, MEMBER } from './support/accounts.js';
import { loginFromHeader } from './support/actions.js';

const ADMIN_HEADING = '관리 · 정책 수집';

test('관리자는 정책 수집 화면에서 수집을 실행하고 결과를 본다', async ({ page }) => {
  await page.goto('/');
  await loginFromHeader(page, ADMIN);

  // 새로고침으로 들어가도 세션이 복구된 뒤 관리자 화면이 열린다.
  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: ADMIN_HEADING })).toBeVisible();

  await page.getByRole('button', { name: '지금 수집 실행' }).click();

  await expect(page.getByText('정책 수집을 마쳤어요')).toBeVisible();
  await expect(page.getByText('마지막 수집 결과')).toBeVisible();
  await expect(page.getByText(/주거 정책 \d+건 동기화가 완료되었습니다/)).toBeVisible();
});

test('일반 회원은 관리자 화면 주소로 들어가도 홈으로 돌아간다', async ({ page }) => {
  await page.goto('/');
  await loginFromHeader(page, MEMBER);

  await page.goto('/admin');

  await expect(page).toHaveURL('/home');
  await expect(page.getByRole('heading', { name: ADMIN_HEADING })).toBeHidden();
});
