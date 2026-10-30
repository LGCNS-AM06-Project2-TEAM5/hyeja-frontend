/**
 * E-3 회원가입 → 조건 등록 → 검색 → 추천 결과
 *
 * notice: 목 모드 빌드에서 돈다. 가입한 계정은 목 서버(localStorage)에만 생기고,
 *         추천 결과는 목 서버의 판정 로직(src/mocks/judge.js)이 만든다.
 *         그래서 그룹별 건수는 검증하지 않고 "세 그룹이 보인다"까지만 본다.
 * notice: 실서버로 돌리면 가입 계정이 실제 DB에 남는다. 그때는 테스트마다 고유한 이메일을 쓰고
 *         테스트 후 회원 탈퇴(PATCH /api/members/me/delete)로 정리하는 단계를 추가한다.
 */
import { expect, test } from '@playwright/test';

const NEW_ACCOUNT = {
  email: 'e2e-onboarding@hyeja.kr',
  password: 'hyeja1234!',
  nickname: '새내기',
};

const chooseOption = async (page, comboboxName, optionName) => {
  await page.getByRole('combobox', { name: comboboxName }).click();
  await page.getByRole('option', { name: optionName, exact: true }).click();
};

test('계정과 조건을 함께 등록하고 검색하면 추천 결과를 본다', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('banner').getByRole('link', { name: '회원가입' }).click();

  await page.getByLabel('이메일').fill(NEW_ACCOUNT.email);
  await page.getByRole('button', { name: '인증 코드 발송' }).click();
  await page.getByLabel('인증 코드').fill('384021');
  await page.getByRole('button', { name: '인증 코드 확인' }).click();
  await expect(page.getByText('이메일 인증 완료 · 30분 안에 가입해 주세요')).toBeVisible();
  await page.getByLabel('비밀번호', { exact: true }).fill(NEW_ACCOUNT.password);
  await page.getByLabel('비밀번호 확인').fill(NEW_ACCOUNT.password);
  await page.getByLabel('닉네임').fill(NEW_ACCOUNT.nickname);
  await page.getByLabel('생년월일').fill('1999-03-12');
  await chooseOption(page, '시도 선택', '서울특별시');
  await chooseOption(page, '시군구 선택', '마포구');
  await page.getByRole('radio', { name: '미취업자' }).check();
  await page.getByRole('radio', { name: '예, 무주택이에요' }).check();
  await page.getByRole('button', { name: '회원가입' }).click();

  await expect(page).toHaveURL('/home');
  await expect(page.getByText('가입이 완료됐어요')).toBeVisible();

  await page.getByRole('textbox', { name: '정책 검색' }).fill('월세');
  await page.getByRole('button', { name: '검색', exact: true }).click();

  await expect(page).toHaveURL(/\/search\?query=/);
  for (const groupLabel of ['받을 수 있어요', '확인이 필요해요', '아쉽게 안 돼요']) {
    await expect(
      page.getByRole('heading', { name: new RegExp(`^${groupLabel} · \\d+건$`) }),
    ).toBeVisible();
  }
});
