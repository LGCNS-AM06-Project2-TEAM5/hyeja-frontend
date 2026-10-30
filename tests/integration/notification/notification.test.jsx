/**
 * I-9 알림 목록·정책 상세 이동
 *
 * notice: MSW가 백엔드의 ApiResponse + snake_case 알림 계약으로 응답한다.
 */
import { screen, waitFor, within } from '@testing-library/react';
import { http } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import { ENDPOINTS } from '@/api/endpoints';
import { MY_PAGE_TABS, ROUTES, buildPolicyDetailPath } from '@/constants/routes';

import { renderApp, signInAs } from '../../helpers/renderApp';
import { TOKENS } from '../../msw/fixtures';
import { apiUrl, ok } from '../../msw/respond';
import { server } from '../../msw/server';

const NOTIFICATION_ID = 10;
const POLICY_ID = 'R202609230001';
const POLICY_NAME = '서울시 청년 월세 지원';
const CONTENT = '관심 정책의 신청 마감이 일주일 남았어요';

const notification = (readYn = false) => ({
  notification_id: NOTIFICATION_ID,
  member_id: 1,
  policy_id: POLICY_ID,
  policy_name: POLICY_NAME,
  content: CONTENT,
  read_yn: readYn,
  apply_end_date: '2026-10-04',
  created_at: '2026-09-27T10:30:00',
});

const success = (result) => ({
  isSuccess: true,
  code: 'SUCCESS_001',
  message: '성공입니다.',
  result,
});

let listRequests;
let readRequests;

beforeEach(() => {
  listRequests = [];
  readRequests = [];

  server.use(
    http.get(apiUrl(ENDPOINTS.NOTIFICATION.LIST), ({ request }) => {
      listRequests.push(request);

      return ok(
        success({
          notifications: [notification()],
          page: 0,
          size: 8,
          totalElements: 1,
          totalPages: 1,
          hasNext: false,
        }),
      );
    }),
    http.patch(apiUrl(ENDPOINTS.NOTIFICATION.READ(':notificationId')), ({ params, request }) => {
      readRequests.push({ id: params.notificationId, request });
      return ok(success(notification(true)));
    }),
  );
});

describe('알림 목록', () => {
  it('명세의 기본 페이지로 조회하고, 알림을 누르면 읽음 처리 후 정책 상세로 이동한다', async () => {
    signInAs(TOKENS.MEMBER);
    const { user } = renderApp(`${ROUTES.MY_PAGE}?tab=${MY_PAGE_TABS.NOTIFICATION}`);

    expect(await screen.findByText(CONTENT)).toBeInTheDocument();
    expect(screen.getByText(POLICY_NAME)).toBeInTheDocument();

    expect(listRequests.length).toBeGreaterThan(0);
    listRequests.forEach((request) => {
      const url = new URL(request.url);
      expect(request.headers.get('Authorization')).toBe(`Bearer ${TOKENS.MEMBER}`);
      expect(url.searchParams.get('page')).toBe('0');
      expect(url.searchParams.get('size')).toBe('8');
    });

    // 헤더·마이페이지·알림 탭이 같은 알림을 보므로 목록 요청은 한 번만 나간다.
    expect(listRequests).toHaveLength(1);

    await user.click(screen.getByText(CONTENT));

    await waitFor(() => expect(window.location.pathname).toBe(buildPolicyDetailPath(POLICY_ID)));
    await waitFor(() => expect(readRequests).toHaveLength(1));
    expect(readRequests[0].id).toBe(String(NOTIFICATION_ID));
    expect(readRequests[0].request.headers.get('Authorization')).toBe(`Bearer ${TOKENS.MEMBER}`);
  });

  it('안 읽은 개수는 현재 페이지가 아니라 서버가 준 전체 개수로 보여 주고, 모두 읽음은 두지 않는다', async () => {
    server.use(
      http.get(apiUrl(ENDPOINTS.NOTIFICATION.LIST), () =>
        ok(
          success({
            notifications: [notification()],
            unread_count: 15,
            page: 0,
            size: 8,
            totalElements: 20,
            totalPages: 3,
            hasNext: true,
          }),
        ),
      ),
    );
    signInAs(TOKENS.MEMBER);
    renderApp(`${ROUTES.MY_PAGE}?tab=${MY_PAGE_TABS.NOTIFICATION}`);

    expect(
      await screen.findByRole('tab', { name: '알림 목록 15' }, { timeout: 5000 }),
    ).toBeInTheDocument();
    expect(screen.getByText('[마감 7일 이하] 알림 / 안 읽음 (15)')).toBeInTheDocument();
    expect(
      within(screen.getByRole('button', { name: '알림 열기' })).getByText('15'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '모두 읽음' })).not.toBeInTheDocument();
  });

  it('2페이지를 누르면 그 페이지 알림만 따로 받아 보여 준다', async () => {
    const pageRequests = [];
    const SECOND_PAGE_POLICY_NAME = '경기도 청년 전세 지원';

    server.use(
      http.get(apiUrl(ENDPOINTS.NOTIFICATION.LIST), ({ request }) => {
        const page = Number(new URL(request.url).searchParams.get('page'));
        pageRequests.push(page);

        return ok(
          success({
            notifications: [
              page === 0
                ? notification()
                : { ...notification(), notification_id: 11, policy_name: SECOND_PAGE_POLICY_NAME },
            ],
            unread_count: 2,
            page,
            size: 8,
            totalElements: 9,
            totalPages: 2,
            hasNext: page === 0,
          }),
        );
      }),
    );
    signInAs(TOKENS.MEMBER);
    const { user } = renderApp(`${ROUTES.MY_PAGE}?tab=${MY_PAGE_TABS.NOTIFICATION}`);

    expect(await screen.findByText(POLICY_NAME, undefined, { timeout: 5000 })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Go to page 2' }));

    expect(await screen.findByText(SECOND_PAGE_POLICY_NAME)).toBeInTheDocument();
    expect(screen.queryByText(POLICY_NAME)).not.toBeInTheDocument();
    expect(pageRequests).toEqual([0, 1]);
  });

  it('헤더 알림 창에서 알림을 누르면 창을 닫고 정책 상세로 이동한다', async () => {
    signInAs(TOKENS.MEMBER);
    const { user } = renderApp(ROUTES.HOME);

    await user.click(await screen.findByRole('button', { name: '알림 열기' }, { timeout: 5000 }));
    const popover = await screen.findByRole('presentation');
    await user.click(await within(popover).findByText(CONTENT));

    await waitFor(() => expect(window.location.pathname).toBe(buildPolicyDetailPath(POLICY_ID)));
    await waitFor(() => expect(screen.queryByText('알림함 전체 보기')).not.toBeInTheDocument());
  });
});
