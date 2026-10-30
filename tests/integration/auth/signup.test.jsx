import { act, screen, waitFor, within } from '@testing-library/react';
import { http } from 'msw';
import { describe, expect, it } from 'vitest';

import { ENDPOINTS } from '@/api/endpoints';
import { ERROR_MESSAGES } from '@/constants/messages';
import { ROUTES } from '@/constants/routes';
import { tokenStorage } from '@/utils/tokenStorage';

import { renderApp } from '../../helpers/renderApp';
import { TOKENS } from '../../msw/fixtures';
import { apiUrl, fail, ok } from '../../msw/respond';
import { server } from '../../msw/server';

const chooseOption = async (user, comboboxName, optionName) => {
  await user.click(screen.getByRole('combobox', { name: comboboxName }));
  await user.click(within(screen.getByRole('listbox')).getByRole('option', { name: optionName }));
};

describe('회원가입', () => {
  it('지역 목록 조회가 실패하면 다시 시도해 가입 폼을 표시한다', async () => {
    server.use(http.get(apiUrl(ENDPOINTS.CODE.REGIONS), () => fail(500), { once: true }));
    const { user } = renderApp(ROUTES.SIGNUP);

    expect(await screen.findByRole('alert', {}, { timeout: 5000 })).toHaveTextContent(
      ERROR_MESSAGES.SERVER,
    );

    await user.click(screen.getByRole('button', { name: '다시 시도' }));

    expect(await screen.findByLabelText('이메일')).toBeInTheDocument();
    expect(screen.getByLabelText('생년월일')).toBeInTheDocument();
  });

  it('계정과 profile을 한 요청으로 저장한 뒤 로그인한다', async () => {
    let signupBody;
    let verificationEmail;
    let verificationConfirmation;

    server.use(
      http.post(apiUrl(ENDPOINTS.AUTH.EMAIL_VERIFICATION), async ({ request }) => {
        verificationEmail = await request.json();
        return ok({ expiresInSeconds: 300 });
      }),
      http.post(apiUrl(ENDPOINTS.AUTH.EMAIL_VERIFICATION_CONFIRMATION), async ({ request }) => {
        verificationConfirmation = await request.json();
        return ok({ verified: true });
      }),
      http.post(apiUrl(ENDPOINTS.AUTH.SIGNUP), async ({ request }) => {
        signupBody = await request.json();

        return ok({
          isSuccess: true,
          result: {
            memberId: 3,
            email: signupBody.email,
            nickname: signupBody.nickname,
            createdAt: '2026-09-27T00:00:00',
          },
        });
      }),
      http.post(apiUrl(ENDPOINTS.AUTH.LOGIN), () =>
        ok({
          isSuccess: true,
          result: { accessToken: TOKENS.NEW_USER, memberId: 3, nickname: '새내기' },
        }),
      ),
    );

    const { user } = renderApp(ROUTES.SIGNUP);

    await user.type(await screen.findByLabelText('이메일'), 'new@hyeja.kr');
    screen
      .getAllByRole('radio', { name: '선택 안 함' })
      .forEach((radio) => expect(radio).toBeChecked());
    await user.type(screen.getByLabelText('비밀번호', { exact: true }), 'hyeja1234!');
    await user.type(screen.getByLabelText('비밀번호 확인'), 'hyeja1234!');
    await user.type(screen.getByLabelText('닉네임'), '새내기');
    await user.type(screen.getByLabelText('생년월일'), '2000-03-15');
    await chooseOption(user, '시도 선택', '서울특별시');
    await chooseOption(user, '시군구 선택', '마포구');
    await user.click(screen.getByRole('radio', { name: '재직자' }));
    await user.click(screen.getByRole('radio', { name: '예, 무주택이에요' }));

    expect(screen.getByRole('button', { name: '회원가입' })).toBeDisabled();
    expect(signupBody).toBeUndefined();

    await user.click(screen.getByRole('button', { name: '인증 코드 발송' }));
    expect(await screen.findByText(/남은 시간 0[45]:\d{2}/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /재발송 \(\d+초\)/ })).toBeDisabled();
    await user.type(screen.getByLabelText('인증 코드'), '384021');
    await user.click(screen.getByRole('button', { name: '인증 코드 확인' }));
    expect(await screen.findByText(/이메일 인증 완료/)).toBeInTheDocument();
    expect(screen.getByLabelText('이메일')).toBeEnabled();
    expect(screen.getByRole('button', { name: '회원가입' })).toBeEnabled();
    await user.click(screen.getByRole('button', { name: '회원가입' }));

    await waitFor(() => expect(window.location.pathname).toBe(ROUTES.HOME));
    expect(verificationEmail).toEqual({ email: 'new@hyeja.kr' });
    expect(verificationConfirmation).toEqual({ email: 'new@hyeja.kr', code: '384021' });
    expect(signupBody).toEqual({
      email: 'new@hyeja.kr',
      password: 'hyeja1234!',
      nickname: '새내기',
      profile: {
        birth: '2000-03-15',
        regionCode: '11440',
        employmentCode: 'EMPLOYED',
        houselessYn: true,
        marriageCode: null,
        incomeRangeCode: null,
        educationCode: null,
        housingType: null,
      },
    });
    expect(tokenStorage.getAccessToken()).toBe(TOKENS.NEW_USER);
    expect(screen.getByText('가입이 완료됐어요')).toBeInTheDocument();
  }, 30000);

  it('이메일 변경 전에 시작한 발송 응답을 적용하지 않는다', async () => {
    let resolveSend;
    let markSendStarted;
    const sendStarted = new Promise((resolve) => {
      markSendStarted = resolve;
    });

    server.use(
      http.post(apiUrl(ENDPOINTS.AUTH.EMAIL_VERIFICATION), async () => {
        markSendStarted();
        await new Promise((resolve) => {
          resolveSend = resolve;
        });
        return ok({ expiresInSeconds: 300 });
      }),
    );

    const { user } = renderApp(ROUTES.SIGNUP);
    const emailInput = await screen.findByLabelText('이메일');

    await user.type(emailInput, 'first@hyeja.kr');
    await user.click(screen.getByRole('button', { name: '인증 코드 발송' }));
    await sendStarted;
    await user.clear(emailInput);
    await user.type(emailInput, 'second@hyeja.kr');
    await act(async () => {
      resolveSend();
    });

    await waitFor(() => {
      expect(screen.queryByLabelText('인증 코드')).not.toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: '인증 코드 발송' })).toBeEnabled();
  });

  it('이메일 변경 전에 시작한 확인 응답을 적용하지 않는다', async () => {
    let resolveConfirmation;
    let markConfirmationStarted;
    const confirmationStarted = new Promise((resolve) => {
      markConfirmationStarted = resolve;
    });

    server.use(
      http.post(apiUrl(ENDPOINTS.AUTH.EMAIL_VERIFICATION_CONFIRMATION), async () => {
        markConfirmationStarted();
        await new Promise((resolve) => {
          resolveConfirmation = resolve;
        });
        return ok({ verified: true });
      }),
    );

    const { user } = renderApp(ROUTES.SIGNUP);
    const emailInput = await screen.findByLabelText('이메일');

    await user.type(emailInput, 'first@hyeja.kr');
    await user.click(screen.getByRole('button', { name: '인증 코드 발송' }));
    await user.type(await screen.findByLabelText('인증 코드'), '384021');
    await user.click(screen.getByRole('button', { name: '인증 코드 확인' }));
    await confirmationStarted;
    await user.clear(emailInput);
    await user.type(emailInput, 'second@hyeja.kr');
    await act(async () => {
      resolveConfirmation();
    });

    await waitFor(() => {
      expect(screen.queryByText(/이메일 인증 완료/)).not.toBeInTheDocument();
    });
    expect(screen.queryByLabelText('인증 코드')).not.toBeInTheDocument();
  });
});
