/**
 * E-1 비로그인 둘러보기: 홈 → 검색 잠금 안내 → 정책 상세 → 뒤로 가기
 *
 * 설계서상 비로그인 사용자는 검색을 쓸 수 없다(S-06 로그인 안내 창).
 * 그래서 추천 결과까지 가는 여정은 로그인 상태인 E-3에서 본다.
 *
 * notice: 목 모드 빌드에서 돈다. 정책 목록과 상세는 앱에 내장된 목 데이터다.
 */
import { expect, test } from '@playwright/test';

test('비로그인 사용자는 검색 대신 로그인 안내를 보고, 정책 상세를 둘러본 뒤 홈으로 돌아온다', async ({
  page,
}) => {
  await page.goto('/home');
  const homeHeading = page.getByRole('heading', { name: '받을 수 있는 주거 혜택, 한 번에 찾아요' });
  await expect(homeHeading).toBeVisible();

  await page.getByRole('button', { name: '검색', exact: true }).click();
  const notice = page.getByRole('dialog');
  await expect(notice.getByText('로그인하고 1초만에 찾아보기')).toBeVisible();
  await notice.getByRole('button', { name: '닫기' }).click();
  await expect(notice).toBeHidden();

  // 목록의 첫 정책을 눌러 상세로 간다. 상세 페이지는 lazy 로딩된다.
  const firstPolicy = page.locator('main a[href^="/policies/"]').first();
  await firstPolicy.click({ position: { x: 8, y: 8 } });

  await expect(page).toHaveURL(/\/policies\/\d+$/);
  await expect(
    page.getByText('로그인하면 내 조건과 비교한 신청 가능 여부를 확인할 수 있어요.'),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: '로그인하고 확인하기' })).toBeVisible();

  await page.goBack();

  await expect(page).toHaveURL('/home');
  await expect(homeHeading).toBeVisible();
});
