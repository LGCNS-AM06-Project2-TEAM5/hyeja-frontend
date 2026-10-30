/**
 * I-8 관심 정책 (S-07 관심 저장, S-14 관심 목록)
 *
 * notice: 실제 백엔드 없이 MSW가 관심 목록·저장·해제와 정책 상세에 응답한다.
 *         저장 후 목록이 바뀌는 흐름은 테스트 안의 favoriteIds 배열로 서버 상태를 흉내 내고,
 *         상세 응답의 isFavorite도 같은 배열로 만든다.
 * notice: 중복 저장(409 FAVORITE_001)·없는 관심 해제(404 FAVORITE_002) 코드는 백엔드 ErrorStatus 기준이다.
 */
import { screen, waitFor, within } from '@testing-library/react';
import { HttpResponse, delay, http } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import { ENDPOINTS } from '@/api/endpoints';
import { EMPTY_MESSAGES, ERROR_MESSAGES, TOAST_MESSAGES } from '@/constants/messages';
import { ROUTES } from '@/constants/routes';
import { POLICIES } from '@/mocks/data/policies';

import { renderApp, signInAs } from '../../helpers/renderApp';
import {
  FAVORITE_POLICY,
  MEMBER_CREDENTIALS,
  POLICY,
  TOKENS,
  buildFavoriteList,
  buildPolicyDetail,
} from '../../msw/fixtures';
import { apiUrl, fail, ok } from '../../msw/respond';
import { server } from '../../msw/server';

const DETAIL_PATH = `/policies/${POLICY.id}`;

let favoriteIds;
let requests;
let listRequests;

/** 저장·해제 요청을 기록하고, 관심 목록 응답에 바로 반영하는 가짜 서버 상태 */
const mockFavoriteServer = () => {
  const verifyTokenRequest = (request) => {
    expect(request.headers.get('Authorization')).toBe(`Bearer ${TOKENS.MEMBER}`);
    expect(new URL(request.url).searchParams.has('memberId')).toBe(false);
  };

  server.use(
    http.get(apiUrl(ENDPOINTS.POLICY.DETAIL(':policyId')), ({ params, request }) => {
      const policy = POLICIES.find((item) => item.id === Number(params.policyId));
      const isAuthenticated = request.headers.has('Authorization');

      return ok({
        isSuccess: true,
        result: buildPolicyDetail(policy, {
          isAuthenticated,
          isFavorite: favoriteIds.includes(policy.id),
        }),
      });
    }),
    http.get(apiUrl(ENDPOINTS.FAVORITE.LIST), ({ request }) => {
      verifyTokenRequest(request);
      listRequests.push(new URL(request.url).searchParams);
      return ok(
        buildFavoriteList(
          favoriteIds.map((policyId) => POLICIES.find((policy) => policy.id === policyId)),
        ),
      );
    }),
    http.post(apiUrl(ENDPOINTS.FAVORITE.DETAIL(':policyId')), ({ params, request }) => {
      verifyTokenRequest(request);
      requests.push(`POST ${params.policyId}`);
      favoriteIds = [...favoriteIds, Number(params.policyId)];
      return ok();
    }),
    http.delete(apiUrl(ENDPOINTS.FAVORITE.DETAIL(':policyId')), ({ params, request }) => {
      verifyTokenRequest(request);
      requests.push(`DELETE ${params.policyId}`);
      favoriteIds = favoriteIds.filter((policyId) => policyId !== Number(params.policyId));
      return ok();
    }),
  );
};

beforeEach(() => {
  favoriteIds = [];
  requests = [];
  listRequests = [];
  mockFavoriteServer();
});

describe('관심 정책 저장·해제', () => {
  it('관심 저장을 누르면 저장하고, 다시 누르면 해제한다', async () => {
    signInAs(TOKENS.MEMBER);
    const { user } = renderApp(DETAIL_PATH);

    await user.click(await screen.findByRole('button', { name: '관심 저장' }, { timeout: 5000 }));

    expect(await screen.findByRole('button', { name: '관심 해제' })).toBeInTheDocument();
    expect(screen.getByText(TOAST_MESSAGES.FAVORITE_ADDED)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '관심 해제' }));

    expect(await screen.findByRole('button', { name: '관심 저장' })).toBeInTheDocument();
    expect(requests).toEqual([`POST ${POLICY.id}`, `DELETE ${POLICY.id}`]);
  });

  it('비로그인이면 로그인을 요구하고, 로그인하면 누르려던 저장을 이어서 한다', async () => {
    const { user } = renderApp(DETAIL_PATH);

    await user.click(await screen.findByRole('button', { name: '관심 저장' }));

    expect(screen.getByText(TOAST_MESSAGES.LOGIN_REQUIRED)).toBeInTheDocument();
    expect(requests).toEqual([]);

    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText('이메일'), MEMBER_CREDENTIALS.email);
    await user.type(within(dialog).getByLabelText('비밀번호'), MEMBER_CREDENTIALS.password);
    await user.click(within(dialog).getByRole('button', { name: '로그인' }));

    await waitFor(() => expect(requests).toEqual([`POST ${POLICY.id}`]));
    expect(await screen.findByRole('button', { name: '관심 해제' })).toBeInTheDocument();
  });
});

describe('관심 정책 하트 상태', () => {
  it('관심 목록 첫 페이지에 없는 관심 정책도 상세 응답 기준으로 채운 하트를 보여 주고, 누르면 해제한다', async () => {
    favoriteIds = [POLICY.id];
    // 관심 목록 첫 페이지에는 다른 정책만 있다. 하트는 이 목록을 보지 않아야 한다.
    server.use(
      http.get(apiUrl(ENDPOINTS.FAVORITE.LIST), () =>
        ok(buildFavoriteList([FAVORITE_POLICY], { totalElements: 9 })),
      ),
    );
    signInAs(TOKENS.MEMBER);
    const { user } = renderApp(DETAIL_PATH);

    await user.click(await screen.findByRole('button', { name: '관심 해제' }, { timeout: 5000 }));

    expect(await screen.findByRole('button', { name: '관심 저장' })).toBeInTheDocument();
    expect(requests).toEqual([`DELETE ${POLICY.id}`]);
  });

  it('이미 저장된 정책이라 409가 오면 오류 대신 저장된 하트로 맞춘다', async () => {
    server.use(
      http.post(apiUrl(ENDPOINTS.FAVORITE.DETAIL(':policyId')), () =>
        HttpResponse.json(
          { isSuccess: false, code: 'FAVORITE_001', message: '이미 등록된 관심 정책입니다.' },
          { status: 409 },
        ),
      ),
    );
    signInAs(TOKENS.MEMBER);
    const { user } = renderApp(DETAIL_PATH);

    await user.click(await screen.findByRole('button', { name: '관심 저장' }, { timeout: 5000 }));

    expect(await screen.findByRole('button', { name: '관심 해제' })).toBeInTheDocument();
    expect(screen.queryByText('이미 등록된 관심 정책입니다.')).not.toBeInTheDocument();
  });
});

describe('관심 목록', () => {
  it('관심 정책이 없으면 하트를 누르라는 안내와 주거 정책으로 가는 버튼을 보여 준다', async () => {
    signInAs(TOKENS.MEMBER);
    renderApp(ROUTES.FAVORITE);

    expect(
      await screen.findByText(EMPTY_MESSAGES.FAVORITE, undefined, { timeout: 5000 }),
    ).toBeInTheDocument();
    expect(screen.getByText('저장한 정책을 모아 두는 곳이에요.')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '하트' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '주거 정책 보러 가기' })).toHaveAttribute(
      'href',
      ROUTES.HOME,
    );
  });

  it('목록을 못 불러오면 오류 상태를 보여 주고, 다시 시도하면 목록을 보여 준다', async () => {
    favoriteIds = [FAVORITE_POLICY.id];
    server.use(http.get(apiUrl(ENDPOINTS.FAVORITE.LIST), () => fail(500), { once: true }));
    signInAs(TOKENS.MEMBER);
    const { user } = renderApp(ROUTES.FAVORITE);

    expect(await screen.findByRole('alert')).toHaveTextContent(ERROR_MESSAGES.SERVER);

    await user.click(screen.getByRole('button', { name: '다시 시도' }));

    expect(await screen.findByText(FAVORITE_POLICY.title)).toBeInTheDocument();
  });

  it('목록에서 해제하면 목록에서 빠진다', async () => {
    favoriteIds = [FAVORITE_POLICY.id];
    signInAs(TOKENS.MEMBER);
    const { user } = renderApp(ROUTES.FAVORITE);

    await screen.findByText(FAVORITE_POLICY.title);
    await user.click(screen.getByRole('button', { name: '관심 정책 해제' }));

    await waitFor(() => expect(screen.queryByText(FAVORITE_POLICY.title)).not.toBeInTheDocument());
    expect(requests).toEqual([`DELETE ${FAVORITE_POLICY.id}`]);
  });

  it('최근 저장순으로 보여 주고, 2페이지를 누르면 다음 페이지를 요청한다', async () => {
    favoriteIds = [FAVORITE_POLICY.id];
    server.use(
      http.get(apiUrl(ENDPOINTS.FAVORITE.LIST), ({ request }) => {
        const searchParams = new URL(request.url).searchParams;
        listRequests.push(searchParams);
        const page = Number(searchParams.get('page'));

        return ok(
          buildFavoriteList([page === 0 ? FAVORITE_POLICY : POLICY], {
            page,
            totalElements: 9,
          }),
        );
      }),
    );
    signInAs(TOKENS.MEMBER);
    const { user } = renderApp(ROUTES.FAVORITE);

    expect(
      await screen.findByText(FAVORITE_POLICY.title, undefined, { timeout: 5000 }),
    ).toBeInTheDocument();
    expect(screen.getByText('최근 저장순')).toBeInTheDocument();
    expect(screen.queryByText('마감 임박순')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Go to page 2' }));

    expect(await screen.findByText(POLICY.title)).toBeInTheDocument();
    expect(`${window.location.pathname}${window.location.search}`).toBe('/favorites?page=2');
    expect(listRequests.map((params) => params.get('page'))).toEqual(['0', '1']);
  });

  it('2페이지의 상세에 갔다가 뒤로 가면 검색어와 페이지를 복원한다', async () => {
    server.use(
      http.get(apiUrl(ENDPOINTS.FAVORITE.LIST), ({ request }) => {
        const searchParams = new URL(request.url).searchParams;
        listRequests.push(searchParams);

        return ok(
          buildFavoriteList([POLICY], {
            page: Number(searchParams.get('page')),
            totalElements: 9,
          }),
        );
      }),
    );
    signInAs(TOKENS.MEMBER);
    const { user } = renderApp('/favorites?keyword=청년&page=2');

    expect(await screen.findByText(POLICY.title, undefined, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: '관심 정책 검색' })).toHaveValue('청년');

    await user.click(screen.getByText(POLICY.title));
    expect(
      await screen.findByRole('heading', { level: 1, name: POLICY.title }),
    ).toBeInTheDocument();

    window.history.back();

    await waitFor(() =>
      expect(`${window.location.pathname}${window.location.search}`).toBe(
        '/favorites?keyword=%EC%B2%AD%EB%85%84&page=2',
      ),
    );
    expect(await screen.findByText(POLICY.title)).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: '관심 정책 검색' })).toHaveValue('청년');
    expect(listRequests.map((params) => params.get('page'))).toEqual(['1', '1']);
    expect(listRequests.map((params) => params.get('keyword'))).toEqual(['청년', '청년']);
  });

  it('다른 검색 결과를 본 뒤 뒤로 가도 현재 요청이 끝나기 전에 이전 결과로 페이지를 보정하지 않는다', async () => {
    let secondPageRequestCount = 0;
    server.use(
      http.get(apiUrl(ENDPOINTS.FAVORITE.LIST), async ({ request }) => {
        const searchParams = new URL(request.url).searchParams;
        listRequests.push(searchParams);
        const keyword = searchParams.get('keyword');
        const page = Number(searchParams.get('page'));

        if (keyword === 'B' && page === 1) {
          secondPageRequestCount += 1;
          if (secondPageRequestCount === 2) {
            await delay(200);
          }

          return ok(buildFavoriteList([POLICY], { page, totalElements: 9 }));
        }

        return ok(buildFavoriteList([FAVORITE_POLICY], { page, totalElements: 1 }));
      }),
    );
    signInAs(TOKENS.MEMBER);
    const { user } = renderApp('/favorites?keyword=B&page=2');

    expect(await screen.findByText(POLICY.title, undefined, { timeout: 5000 })).toBeInTheDocument();

    const searchField = screen.getByRole('textbox', { name: '관심 정책 검색' });
    await user.clear(searchField);
    await user.type(searchField, 'A{Enter}');

    expect(await screen.findByText(FAVORITE_POLICY.title)).toBeInTheDocument();
    expect(`${window.location.pathname}${window.location.search}`).toBe('/favorites?keyword=A');

    window.history.back();

    expect(await screen.findByRole('progressbar', { name: '불러오는 중' })).toBeInTheDocument();
    expect(`${window.location.pathname}${window.location.search}`).toBe(
      '/favorites?keyword=B&page=2',
    );
    expect(await screen.findByText(POLICY.title)).toBeInTheDocument();
    expect(`${window.location.pathname}${window.location.search}`).toBe(
      '/favorites?keyword=B&page=2',
    );
  });

  it('검색하면 관심 목록 안에서 keyword로 찾고, AI 검색 화면으로 가지 않는다', async () => {
    favoriteIds = [FAVORITE_POLICY.id];
    signInAs(TOKENS.MEMBER);
    const { user } = renderApp(ROUTES.FAVORITE);

    await screen.findByText(FAVORITE_POLICY.title, undefined, { timeout: 5000 });
    await user.type(screen.getByRole('textbox', { name: '관심 정책 검색' }), '  월세 {Enter}');

    await waitFor(() => expect(listRequests.at(-1).get('keyword')).toBe('월세'));
    expect(listRequests.at(-1).get('page')).toBe('0');
    expect(`${window.location.pathname}${window.location.search}`).toBe(
      '/favorites?keyword=%EC%9B%94%EC%84%B8',
    );
  });
});
