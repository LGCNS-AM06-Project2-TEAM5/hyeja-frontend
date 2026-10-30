/**
 * E-2 로그인 → 관심 정책 저장 → 관심 목록 확인 → 새로고침 후에도 유지
 *
 * notice: 목 모드 빌드에서 돈다. 목 서버는 상태를 localStorage(hyejaMockStore)에 저장하므로
 *         "새로고침 후 유지"는 지금은 브라우저 저장소 기준이다. 실서버로 돌리면 서버 DB 기준이 된다.
 * notice: Playwright는 테스트마다 새 브라우저 컨텍스트를 쓰므로 목 상태가 테스트마다 초기화된다.
 */
import { expect, test } from '@playwright/test';

import { MEMBER } from './support/accounts.js';
import { header, loginFromHeader } from './support/actions.js';

test('관심 정책으로 저장한 정책은 새로고침해도 관심 목록에 남는다', async ({ page }) => {
  await page.goto('/home');
  await loginFromHeader(page, MEMBER);

  // 아직 저장하지 않은 첫 정책의 상세로 간다.
  const unsavedPolicy = page
    .locator('main a[href^="/policies/"]')
    .filter({ has: page.getByRole('button', { name: '관심 정책 저장' }) })
    .first();
  await unsavedPolicy.click({ position: { x: 8, y: 8 } });
  // 상세 페이지는 lazy 청크라서 주소가 먼저 바뀌고 화면은 조금 늦게 바뀐다. 상세 전용 버튼으로 기다린다.
  const saveButton = page.getByRole('button', { name: '관심 저장' });
  await expect(saveButton).toBeVisible();

  const title = await page.getByRole('main').getByRole('heading', { level: 1 }).textContent();
  await saveButton.click();
  await expect(page.getByText('관심 정책에 저장했어요')).toBeVisible();
  await expect(page.getByRole('button', { name: '관심 해제' })).toBeVisible();

  await header(page).getByRole('link', { name: '관심 정책' }).click();
  await expect(page).toHaveURL('/favorites');
  await expect(page.getByRole('main').getByText(title, { exact: true })).toBeVisible();

  await page.reload();

  await expect(header(page).getByRole('button', { name: MEMBER.nickname })).toBeVisible();
  await expect(page.getByRole('main').getByText(title, { exact: true })).toBeVisible();
});
