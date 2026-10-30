/**
 * 홈 "주거 정책" 정렬 드롭다운은 어떤 기준을 골라도 상자 크기가 같다.
 * 상자 크기는 실제 레이아웃이 있어야 잴 수 있어서 jsdom 통합 테스트가 아니라 브라우저에서 본다.
 *
 * notice: 목 모드 빌드에서 돈다. 정렬 옵션 이름은 src/constants/policy.js의 값이다.
 */
import { expect, test } from '@playwright/test';

import { POLICY_SORT_OPTIONS } from '../../src/constants/policy.js';

test('정렬 기준을 바꿔도 드롭다운 상자 크기가 그대로다', async ({ page }) => {
  await page.goto('/home');

  const sortSelect = page.getByRole('combobox', { name: '정렬 기준' });
  // 웹 글꼴(display=swap)이 늦게 오면 대체 글꼴 폭으로 재게 되므로, 글꼴을 다 받은 뒤에 잰다.
  const measureBox = () =>
    sortSelect.evaluate(async (element) => {
      await document.fonts.ready;
      const { width, height } = element.closest('.MuiInputBase-root').getBoundingClientRect();

      return { width, height };
    });

  await expect(sortSelect).toMatchAriaSnapshot(
    `- combobox "정렬 기준": ${POLICY_SORT_OPTIONS[0].label}`,
  );
  const initialBox = await measureBox();

  for (const option of POLICY_SORT_OPTIONS.slice(1)) {
    await sortSelect.click();
    await page.getByRole('option', { name: option.label }).click();

    // 겹쳐 둔 다른 옵션 이름은 숨겨져 있어서, 화면 낭독기에는 고른 이름만 읽힌다.
    await expect(sortSelect).toMatchAriaSnapshot(`- combobox "정렬 기준": ${option.label}`);
    expect(await measureBox()).toEqual(initialBox);
  }
});
