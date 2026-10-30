import { expect, test } from '@playwright/test';

const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 812, headingSize: '34px' },
  { name: 'tablet', width: 768, height: 1024, headingSize: '42px' },
];

for (const viewport of VIEWPORTS) {
  test(`${viewport.name} 랜딩은 화면 밖으로 넘치지 않고 타이포 크기를 조정한다`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');

    await expect(page).toHaveURL('/landing');

    const heading = page.getByRole('heading', {
      name: '받을 수 있는 주거 혜택, 한 번에 찾아요',
    });

    await expect(heading).toBeVisible();
    await expect(heading).toHaveCSS('font-size', viewport.headingSize);
    await expect(page.getByRole('heading', { name: '복잡한 주거 정책이 쉬워져요' })).toBeVisible();

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );

    expect(hasHorizontalOverflow).toBe(false);
  });
}
