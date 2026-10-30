/**
 * E-4 비로그인으로 보호 경로 직접 접근 → 로그인 모달 → 로그인 → 보호 화면 사용
 *
 * notice: 목 모드 빌드에서 돈다. 로그인 계정은 목 계정이다(support/accounts.js).
 */
import { expect, test } from '@playwright/test';

import { MEMBER } from './support/accounts.js';
import { header, submitLoginDialog } from './support/actions.js';

test('주소창으로 관심 정책에 들어오면 로그인을 요구하고, 로그인 후에는 들어갈 수 있다', async ({
  page,
}) => {
  await page.goto('/favorites');

  await expect(page).toHaveURL('/home');
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByText('로그인하면 내 조건으로 판정해드려요').first()).toBeVisible();

  await submitLoginDialog(page, MEMBER);

  await header(page).getByRole('link', { name: '관심 정책' }).click();
  await expect(page).toHaveURL('/favorites');
  await expect(page.getByRole('heading', { name: '관심 정책' })).toBeVisible();
  await expect(page.getByRole('button', { name: '관심 정책 해제' }).first()).toBeVisible();
});
