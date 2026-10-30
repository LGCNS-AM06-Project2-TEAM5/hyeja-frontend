/**
 * I-10 관리자 정책 수집(동기화)
 *
 * notice: MSW가 백엔드 POST /api/policies/sync 응답을 흉내 낸다. 실서버는 정책마다 OpenAI 분석을 호출해
 *         몇 분씩 걸리고 비용이 들므로, 실제 수집은 테스트에서 부르지 않는다.
 * notice: 성공 응답(result 문구)과 중단 응답(502 POLICY_002, result.stoppedPage·savedCount)은
 *         백엔드 PolicyController·PolicyService 기준이다. 형태가 바뀌면 fixtures의
 *         POLICY_SYNC_RESPONSE·POLICY_SYNC_STOPPED_RESPONSE와 adminApi.toPolicySyncStop을 함께 고친다.
 */
import { screen } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import { ENDPOINTS } from '@/api/endpoints';
import { TOAST_MESSAGES } from '@/constants/messages';
import { ROUTES } from '@/constants/routes';

import { renderApp, signInAs } from '../../helpers/renderApp';
import { POLICY_SYNC_RESPONSE, POLICY_SYNC_STOPPED_RESPONSE, TOKENS } from '../../msw/fixtures';
import { apiUrl } from '../../msw/respond';
import { server } from '../../msw/server';

const openAdminPage = async () => {
  signInAs(TOKENS.ADMIN);
  const view = renderApp(ROUTES.ADMIN);
  await screen.findByRole('heading', { name: '관리 · 정책 수집' }, { timeout: 5000 });

  return view;
};

describe('관리자 정책 수집', () => {
  it('수집을 마치면 백엔드가 준 결과 문구를 그대로 보여 준다', async () => {
    const { user } = await openAdminPage();

    await user.click(screen.getByRole('button', { name: '지금 수집 실행' }));

    expect(await screen.findByText(TOAST_MESSAGES.ADMIN_COLLECT_DONE)).toBeInTheDocument();
    expect(screen.getByText('마지막 수집 결과')).toBeInTheDocument();
    expect(screen.getByText(POLICY_SYNC_RESPONSE.result)).toBeInTheDocument();
  });

  it('수집이 중간에 멈추면 멈춘 페이지와 저장 건수를 보여 준다', async () => {
    server.use(
      http.post(apiUrl(ENDPOINTS.ADMIN.POLICY_SYNC), () =>
        HttpResponse.json(POLICY_SYNC_STOPPED_RESPONSE, { status: 502 }),
      ),
    );
    const { user } = await openAdminPage();

    await user.click(screen.getByRole('button', { name: '지금 수집 실행' }));

    expect(await screen.findByText(TOAST_MESSAGES.ADMIN_COLLECT_STOPPED)).toBeInTheDocument();
    expect(screen.getByText('중단')).toBeInTheDocument();
    expect(screen.getByText('3페이지')).toBeInTheDocument();
    expect(screen.getByText(/^200건/)).toBeInTheDocument();
    expect(screen.getByText(POLICY_SYNC_STOPPED_RESPONSE.message)).toBeInTheDocument();
  });
});
