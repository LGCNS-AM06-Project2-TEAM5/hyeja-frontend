import { expect } from '@playwright/test';

export const header = (page) => page.getByRole('banner');

/** 이미 열린 로그인 모달에 계정을 입력하고, 모달이 닫힐 때까지 기다린다. */
export const submitLoginDialog = async (page, account) => {
  const dialog = page.getByRole('dialog');

  await dialog.getByLabel('이메일').fill(account.email);
  await dialog.getByLabel('비밀번호').fill(account.password);
  await dialog.getByRole('button', { name: '로그인' }).click();

  await expect(dialog).toBeHidden();
  await expect(header(page).getByRole('button', { name: account.nickname })).toBeVisible();
};

/** 헤더의 로그인 버튼으로 로그인한다. */
export const loginFromHeader = async (page, account) => {
  await header(page).getByRole('button', { name: '로그인' }).click();
  await submitLoginDialog(page, account);
};
