/**
 * I-7 추천 결과 (S-05)
 *
 * notice: 실제 백엔드(AI 판정) 없이 MSW가 GET /api/policies/search 응답을 준다. 그룹 구성은 fixtures의 고정값이다.
 *         응답 형태(approved · underReview · declined)는 백엔드 PolicySearchResponseDTO를 따른다.
 *         DTO가 바뀌면 fixtures.POLICY_SEARCH_RESULT와 policyApi.toPolicySearchResult부터 맞춘다.
 * notice: 후보 0건은 백엔드 ErrorStatus.POLICY_SEARCH_EMPTY처럼 HTTP 200에
 *         { isSuccess: false, code: 'POLICY_SEARCH_001', result: null }로 온다고 둔다.
 *         코드나 상태가 바뀌면 fixtures.NO_CANDIDATE_POLICY_SEARCH_RESPONSE와 toPolicySearchResult를 맞춘다.
 * notice: 검색 API는 로그인이 필요하다(백엔드 SecurityConfig). 그래서 비로그인은 요청 자체를 하지 않는다.
 * notice: 검색창 아래 "적용된 내 조건"은 검색 응답이 아니라 GET /api/members/me/profile(ProfileResponseDTO)의
 *         이름 필드(regionName·employmentName·housingTypeName 등)로 만든다. 필드가 바뀌면 userApi.toAppliedConditions를 맞춘다.
 * notice: 검색 유형은 응답에 없어서 "#월세"처럼 해시태그 검색일 때만 보여 준다(백엔드 PolicySearchService.HASHTAG_CATEGORIES).
 */
import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { ENDPOINTS } from '@/api/endpoints';
import { EMPTY_MESSAGES, ERROR_MESSAGES, TOAST_MESSAGES } from '@/constants/messages';
import { RECOMMENDATION_GROUP, RECOMMENDATION_GROUP_LABEL } from '@/constants/policy';
import { buildMyPagePath, MY_PAGE_TABS } from '@/constants/routes';
import { STORAGE_KEYS } from '@/constants/storageKeys';

import { findHeader, renderApp, signInAs } from '../../helpers/renderApp';
import {
  EMPTY_POLICY_SEARCH_RESULT,
  MEMBER_CREDENTIALS,
  MEMBER_USER,
  NO_CANDIDATE_POLICY_SEARCH_RESPONSE,
  POLICY_SEARCH_RESULT,
  TOKENS,
} from '../../msw/fixtures';
import { apiUrl, fail, ok } from '../../msw/respond';
import { server } from '../../msw/server';

const RESULT_PATH = `/search?query=${encodeURIComponent('월세')}`;
const LOADING_TEXT = 'AI가 내 조건으로 정책을 확인하고 있어요';
const GUEST_NOTICE = '로그인하면 내 조건으로 판정해드려요';
// fixtures.MEMBER_PROFILE_RESPONSE(만 27세 · 마포구 · 미취업자 · 무주택 · 월세)를 화면 문구로 옮긴 값
const APPLIED_CONDITIONS = ['만 27세', '서울특별시 마포구', '미취업자', '무주택', '월세 거주'];

const SEARCH_RESULT_KEYS = {
  [RECOMMENDATION_GROUP.POSSIBLE]: 'approved',
  [RECOMMENDATION_GROUP.NEED_CHECK]: 'underReview',
  [RECOMMENDATION_GROUP.IMPOSSIBLE]: 'declined',
};

const groupHeading = (group, count) =>
  screen.findByRole('heading', { name: `${RECOMMENDATION_GROUP_LABEL[group]} · ${count}건` });

describe('추천 결과', () => {
  it('응답을 기다리는 동안 결과 모양의 스켈레톤을 보여 준다', async () => {
    signInAs(TOKENS.MEMBER);
    renderApp(RESULT_PATH);

    expect(await screen.findByText(LOADING_TEXT)).toBeInTheDocument();
    expect(await groupHeading(RECOMMENDATION_GROUP.POSSIBLE, 1)).toBeInTheDocument();
    expect(screen.queryByText(LOADING_TEXT)).not.toBeInTheDocument();
  });

  it('가능 · 확인 필요 · 불가 그룹으로 나눠 정책을 보여 준다', async () => {
    signInAs(TOKENS.MEMBER);
    renderApp(RESULT_PATH);

    for (const group of Object.values(RECOMMENDATION_GROUP)) {
      const [policy] = POLICY_SEARCH_RESULT.result[SEARCH_RESULT_KEYS[group]];

      expect(await groupHeading(group, 1)).toBeInTheDocument();
      expect(screen.getByText(policy.policyName)).toBeInTheDocument();
      expect(screen.getByText(policy.aiReason)).toBeInTheDocument();
    }
  });

  it('후보가 0건이면 빈 상태와 안내 토스트를 보여 준다', async () => {
    server.use(http.get(apiUrl(ENDPOINTS.POLICY.SEARCH), () => ok(EMPTY_POLICY_SEARCH_RESULT)));
    signInAs(TOKENS.MEMBER);
    renderApp(RESULT_PATH);

    expect(await screen.findByText(EMPTY_MESSAGES.SEARCH)).toBeInTheDocument();
    expect(await screen.findByText(TOAST_MESSAGES.NO_CANDIDATE)).toBeInTheDocument();
  });

  it('서버가 후보 0건(POLICY_SEARCH_001) 봉투를 주면 빈 상태와 안내 토스트를 보여 준다', async () => {
    server.use(
      http.get(apiUrl(ENDPOINTS.POLICY.SEARCH), () => ok(NO_CANDIDATE_POLICY_SEARCH_RESPONSE)),
    );
    signInAs(TOKENS.MEMBER);
    renderApp(RESULT_PATH);

    expect(await screen.findByText(EMPTY_MESSAGES.SEARCH)).toBeInTheDocument();
    expect(await screen.findByText(TOAST_MESSAGES.NO_CANDIDATE)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /건$/ })).not.toBeInTheDocument();
  });

  it('0건 뒤 다시 검색해도 0건이면 안내 토스트를 다시 보여 준다', async () => {
    const requestedQueries = [];
    server.use(
      http.get(apiUrl(ENDPOINTS.POLICY.SEARCH), ({ request }) => {
        requestedQueries.push(new URL(request.url).searchParams.get('query'));

        return ok(EMPTY_POLICY_SEARCH_RESULT);
      }),
    );
    signInAs(TOKENS.MEMBER);
    const { user } = renderApp(RESULT_PATH);

    expect(await screen.findByText(TOAST_MESSAGES.NO_CANDIDATE)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() =>
      expect(screen.queryByText(TOAST_MESSAGES.NO_CANDIDATE)).not.toBeInTheDocument(),
    );

    const searchInput = screen.getByRole('textbox', { name: '정책 검색' });
    await user.clear(searchInput);
    await user.type(searchInput, '전세');
    await user.click(screen.getByRole('button', { name: '검색', exact: true }));

    await waitFor(() => expect(requestedQueries).toEqual(['월세', '전세']));
    expect(await screen.findByText(TOAST_MESSAGES.NO_CANDIDATE)).toBeInTheDocument();
  });

  it('해시태그로 검색하면 그 유형으로 찾았다고 알리고, 판정에 쓴 내 조건을 함께 보여 준다', async () => {
    signInAs(TOKENS.MEMBER);
    renderApp(`/search?query=${encodeURIComponent('#월세')}`);

    expect(await groupHeading(RECOMMENDATION_GROUP.POSSIBLE, 1)).toBeInTheDocument();
    expect(screen.getByText('‘월세’ 유형으로 찾았어요')).toBeInTheDocument();
    expect(
      await screen.findByText(`${APPLIED_CONDITIONS.join(' · ')}`, { exact: false }),
    ).toBeInTheDocument();
  });

  it('자유 문장 검색은 AI가 고른 유형을 응답으로 받지 않으므로 유형 없이 내 조건만 보여 준다', async () => {
    signInAs(TOKENS.MEMBER);
    renderApp(RESULT_PATH);

    expect(await groupHeading(RECOMMENDATION_GROUP.POSSIBLE, 1)).toBeInTheDocument();
    expect(
      await screen.findByText(`${APPLIED_CONDITIONS.join(' · ')}`, { exact: false }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/유형으로 찾았어요$/)).not.toBeInTheDocument();
  });

  it('홈에서 해시태그를 누르면 #이 빠지지 않은 검색어로 검색 화면에서 검색한다', async () => {
    const requestedQueries = [];
    server.use(
      http.get(apiUrl(ENDPOINTS.POLICY.SEARCH), ({ request }) => {
        requestedQueries.push(new URL(request.url).searchParams.get('query'));

        return ok(POLICY_SEARCH_RESULT);
      }),
    );
    signInAs(TOKENS.MEMBER);
    const { user } = renderApp('/home');

    const homeSearchInput = await screen.findByRole('textbox', { name: '정책 검색' });
    await waitFor(() => expect(homeSearchInput).not.toHaveAttribute('readonly'));
    await user.click(screen.getByRole('button', { name: '#월세' }));

    expect(await groupHeading(RECOMMENDATION_GROUP.POSSIBLE, 1)).toBeInTheDocument();
    expect(new URLSearchParams(window.location.search).get('query')).toBe('#월세');
    expect(screen.getByRole('textbox', { name: '정책 검색' })).toHaveValue('#월세');
    expect(requestedQueries).toEqual(['#월세']);
  });

  it('같은 검색어로 다시 검색하면 요청 없이 안내 토스트를 보여 준다', async () => {
    const requestedQueries = [];
    server.use(
      http.get(apiUrl(ENDPOINTS.POLICY.SEARCH), ({ request }) => {
        requestedQueries.push(new URL(request.url).searchParams.get('query'));

        return ok(POLICY_SEARCH_RESULT);
      }),
    );
    signInAs(TOKENS.MEMBER);
    const { user } = renderApp(RESULT_PATH);

    expect(await groupHeading(RECOMMENDATION_GROUP.POSSIBLE, 1)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '검색', exact: true }));

    expect(await screen.findByText('월세로 검색했어요')).toBeInTheDocument();
    expect(requestedQueries).toEqual(['월세']);
  });

  it('같은 검색어가 실패했었다면 다시 검색할 때 재요청한다', async () => {
    server.use(http.get(apiUrl(ENDPOINTS.POLICY.SEARCH), () => fail(500), { once: true }));
    signInAs(TOKENS.MEMBER);
    const { user } = renderApp(RESULT_PATH);

    expect(await screen.findByRole('alert')).toHaveTextContent(ERROR_MESSAGES.SERVER);

    await user.click(screen.getByRole('button', { name: '검색', exact: true }));

    expect(await groupHeading(RECOMMENDATION_GROUP.POSSIBLE, 1)).toBeInTheDocument();
    expect(screen.queryByText('월세로 검색했어요')).not.toBeInTheDocument();
  });

  it('서버 오류면 오류 상태를 보여 주고 다시 시도하면 결과를 불러온다', async () => {
    server.use(http.get(apiUrl(ENDPOINTS.POLICY.SEARCH), () => fail(500), { once: true }));
    signInAs(TOKENS.MEMBER);
    const { user } = renderApp(RESULT_PATH);

    expect(await screen.findByRole('alert')).toHaveTextContent(ERROR_MESSAGES.SERVER);

    await user.click(screen.getByRole('button', { name: '다시 시도' }));

    expect(await groupHeading(RECOMMENDATION_GROUP.POSSIBLE, 1)).toBeInTheDocument();
  });
});

describe('검색 요청 조건', () => {
  const recordSearchRequests = () => {
    const requestedQueries = [];
    server.use(
      http.get(apiUrl(ENDPOINTS.POLICY.SEARCH), ({ request }) => {
        requestedQueries.push(new URL(request.url).searchParams.get('query'));

        return ok(POLICY_SEARCH_RESULT);
      }),
    );

    return requestedQueries;
  };

  const expectNoSearchResultState = () => {
    expect(screen.queryByText(LOADING_TEXT)).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByText(EMPTY_MESSAGES.SEARCH)).not.toBeInTheDocument();
    expect(screen.queryByText(TOAST_MESSAGES.NO_CANDIDATE)).not.toBeInTheDocument();
  };

  it('비로그인은 검색어가 있어도 요청하지 않고 로그인 안내만 보여 준다', async () => {
    const requestedQueries = recordSearchRequests();
    renderApp(RESULT_PATH);

    expect(await screen.findByText(GUEST_NOTICE)).toBeInTheDocument();
    expectNoSearchResultState();
    expect(requestedQueries).toEqual([]);
  });

  it('로그인해도 검색어가 없으면 요청하지 않는다', async () => {
    const requestedQueries = recordSearchRequests();
    signInAs(TOKENS.MEMBER);
    renderApp('/search');

    const searchInput = await screen.findByRole('textbox', { name: '정책 검색' });
    await waitFor(() => expect(searchInput).not.toHaveAttribute('readonly'));

    expectNoSearchResultState();
    expect(screen.queryByText(GUEST_NOTICE)).not.toBeInTheDocument();
    expect(requestedQueries).toEqual([]);
  });

  it('검색 화면에서 로그인하면 주소의 검색어로 바로 검색한다', async () => {
    const requestedQueries = recordSearchRequests();
    const { user } = renderApp(RESULT_PATH);

    expect(await screen.findByText(GUEST_NOTICE)).toBeInTheDocument();

    const header = await findHeader();
    await user.click(header.getByRole('button', { name: '로그인' }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText('이메일'), MEMBER_CREDENTIALS.email);
    await user.type(within(dialog).getByLabelText('비밀번호'), MEMBER_CREDENTIALS.password);
    await user.click(within(dialog).getByRole('button', { name: '로그인' }));

    expect(await groupHeading(RECOMMENDATION_GROUP.POSSIBLE, 1)).toBeInTheDocument();
    expect(requestedQueries).toEqual(['월세']);
  });
});

/**
 * notice: 검색 API는 요청마다 서버가 OpenAI를 부른다. 그래서 뒤로·앞으로 가기로 돌아온 검색은
 *         브라우저(sessionStorage)에 남겨 둔 결과를 쓰고 다시 요청하지 않는다(utils/searchResultCache).
 */
describe('뒤로 가기로 돌아온 검색', () => {
  const recordSearchRequests = () => {
    const requestedQueries = [];
    server.use(
      http.get(apiUrl(ENDPOINTS.POLICY.SEARCH), ({ request }) => {
        requestedQueries.push(new URL(request.url).searchParams.get('query'));

        return ok(POLICY_SEARCH_RESULT);
      }),
    );

    return requestedQueries;
  };

  const [approvedPolicy] = POLICY_SEARCH_RESULT.result.approved;

  const openApprovedPolicyDetail = async (user) => {
    await user.click(screen.getAllByRole('link', { name: /상세 보기/ })[0]);

    return screen.findByRole('heading', { level: 1, name: approvedPolicy.policyName });
  };

  it('정책 상세에 갔다가 뒤로 가면 다시 요청하지 않고 같은 결과를 보여 준다', async () => {
    const requestedQueries = recordSearchRequests();
    signInAs(TOKENS.MEMBER);
    const { user } = renderApp(RESULT_PATH);

    expect(await groupHeading(RECOMMENDATION_GROUP.POSSIBLE, 1)).toBeInTheDocument();
    expect(await openApprovedPolicyDetail(user)).toBeInTheDocument();

    window.history.back();

    expect(await groupHeading(RECOMMENDATION_GROUP.POSSIBLE, 1)).toBeInTheDocument();
    expect(screen.getByText(approvedPolicy.aiReason)).toBeInTheDocument();
    expect(screen.queryByText(LOADING_TEXT)).not.toBeInTheDocument();
    expect(requestedQueries).toEqual(['월세']);
  });

  it('같은 검색어라도 홈에서 새로 검색하면 다시 요청한다', async () => {
    const requestedQueries = recordSearchRequests();
    signInAs(TOKENS.MEMBER);
    const { user } = renderApp('/home');

    const searchFromHome = async () => {
      const homeSearchInput = await screen.findByRole('textbox', { name: '정책 검색' });
      await waitFor(() => expect(homeSearchInput).not.toHaveAttribute('readonly'));
      await user.type(homeSearchInput, '월세');
      await user.click(screen.getByRole('button', { name: '검색', exact: true }));
      expect(await groupHeading(RECOMMENDATION_GROUP.POSSIBLE, 1)).toBeInTheDocument();
    };

    await searchFromHome();
    window.history.back();
    await screen.findByRole('heading', { name: '받을 수 있는 주거 혜택, 한 번에 찾아요' });
    await searchFromHome();

    expect(requestedQueries).toEqual(['월세', '월세']);
  });

  it('상세에서 관심을 저장하고 돌아오면 결과의 하트도 저장된 상태로 보인다', async () => {
    recordSearchRequests();
    signInAs(TOKENS.MEMBER);
    const { user } = renderApp(RESULT_PATH);

    expect(await groupHeading(RECOMMENDATION_GROUP.POSSIBLE, 1)).toBeInTheDocument();
    expect(await openApprovedPolicyDetail(user)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '관심 저장' }));
    expect(await screen.findByRole('button', { name: '관심 해제' })).toBeInTheDocument();

    window.history.back();

    const approvedGroup = (await groupHeading(RECOMMENDATION_GROUP.POSSIBLE, 1)).closest('section');
    expect(
      within(approvedGroup).getByRole('button', { name: '관심 정책 해제' }),
    ).toBeInTheDocument();
  });

  it('검색 화면 안에서 다시 검색했다가 뒤로 가면 검색창도 이전 검색어로 돌아온다', async () => {
    const requestedQueries = recordSearchRequests();
    signInAs(TOKENS.MEMBER);
    const { user } = renderApp(RESULT_PATH);

    expect(await groupHeading(RECOMMENDATION_GROUP.POSSIBLE, 1)).toBeInTheDocument();
    const searchInput = screen.getByRole('textbox', { name: '정책 검색' });
    await user.clear(searchInput);
    await user.type(searchInput, '전세');
    await user.click(screen.getByRole('button', { name: '검색', exact: true }));
    await waitFor(() => expect(requestedQueries).toEqual(['월세', '전세']));
    expect(await groupHeading(RECOMMENDATION_GROUP.POSSIBLE, 1)).toBeInTheDocument();

    window.history.back();

    await waitFor(() =>
      expect(screen.getByRole('textbox', { name: '정책 검색' })).toHaveValue('월세'),
    );
    expect(requestedQueries).toEqual(['월세', '전세']);
  });

  it('로그아웃하면 브라우저에 남겨 둔 검색 결과를 지운다', async () => {
    recordSearchRequests();
    signInAs(TOKENS.MEMBER);
    const { user } = renderApp(RESULT_PATH);

    expect(await groupHeading(RECOMMENDATION_GROUP.POSSIBLE, 1)).toBeInTheDocument();
    expect(sessionStorage.getItem(STORAGE_KEYS.POLICY_SEARCH_CACHE)).not.toBeNull();

    const header = await findHeader();
    await user.click(header.getByRole('button', { name: MEMBER_USER.nickname }));
    await user.click(await screen.findByRole('menuitem', { name: '로그아웃' }));

    expect(await header.findByRole('button', { name: '로그인' })).toBeInTheDocument();
    expect(sessionStorage.getItem(STORAGE_KEYS.POLICY_SEARCH_CACHE)).toBeNull();
  });
});

describe('조건 수정 이동', () => {
  it('0건이면 빈 상태 박스에 적용된 내 조건과 조건 수정을 보여 준다', async () => {
    server.use(http.get(apiUrl(ENDPOINTS.POLICY.SEARCH), () => ok(EMPTY_POLICY_SEARCH_RESULT)));
    signInAs(TOKENS.MEMBER);
    renderApp(RESULT_PATH);

    expect(await screen.findByText(EMPTY_MESSAGES.SEARCH)).toBeInTheDocument();
    expect(screen.getByText(EMPTY_MESSAGES.SEARCH_DESCRIPTION)).toBeInTheDocument();

    const conditionChips = await screen.findByLabelText('적용된 내 조건');
    APPLIED_CONDITIONS.forEach((condition) => {
      expect(within(conditionChips).getByText(condition)).toBeInTheDocument();
    });
    expect(screen.getByRole('link', { name: '내 조건 수정' })).toHaveAttribute(
      'href',
      buildMyPagePath(MY_PAGE_TABS.CONDITION),
    );
    expect(screen.getByRole('link', { name: '조건 수정' })).toHaveAttribute(
      'href',
      buildMyPagePath(MY_PAGE_TABS.CONDITION),
    );
    expect(screen.getByText('수정한 조건은 내 정보에도 반영돼요.')).toBeInTheDocument();
    // 모두 0건인 그룹별 건수 줄과 다시 시도 버튼은 두지 않는다.
    expect(
      screen.queryByText(RECOMMENDATION_GROUP_LABEL[RECOMMENDATION_GROUP.POSSIBLE]),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '다시 시도' })).not.toBeInTheDocument();
  });

  it('빈 검색 결과의 내 조건 수정을 누르면 마이페이지 조건 탭으로 이동한다', async () => {
    server.use(http.get(apiUrl(ENDPOINTS.POLICY.SEARCH), () => ok(EMPTY_POLICY_SEARCH_RESULT)));
    signInAs(TOKENS.MEMBER);
    const { user } = renderApp(RESULT_PATH);

    await user.click(await screen.findByRole('link', { name: '내 조건 수정' }));

    expect(await screen.findByRole('heading', { name: '마이페이지' })).toBeInTheDocument();
    expect(`${window.location.pathname}${window.location.search}`).toBe(
      buildMyPagePath(MY_PAGE_TABS.CONDITION),
    );
    expect(screen.getByRole('tab', { name: '내 조건 수정' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('검색 결과 요약의 조건 수정을 누르면 마이페이지 조건 탭으로 이동한다', async () => {
    signInAs(TOKENS.MEMBER);
    const { user } = renderApp(RESULT_PATH);

    await groupHeading(RECOMMENDATION_GROUP.POSSIBLE, 1);
    await user.click(screen.getByRole('link', { name: '조건 수정' }));

    expect(await screen.findByRole('heading', { name: '마이페이지' })).toBeInTheDocument();
    expect(`${window.location.pathname}${window.location.search}`).toBe(
      buildMyPagePath(MY_PAGE_TABS.CONDITION),
    );
  });
});

/**
 * notice: 백엔드는 주거와 관계없는 검색어를 400 POLICY_SEARCH_002로 거절한다(ErrorStatus.POLICY_SEARCH_NOT_HOUSING).
 *         같은 검색어로 다시 요청해도 결과가 같고 요청마다 AI 비용이 들어서, 다시 시도 대신 검색어 수정을 권한다.
 */
describe('주거와 관계없는 검색어', () => {
  const NOT_HOUSING_PATH = `/search?query=${encodeURIComponent('취업 지원금 알려줘')}`;

  const mockNotHousingSearch = () => {
    const requestedQueries = [];
    server.use(
      http.get(apiUrl(ENDPOINTS.POLICY.SEARCH), ({ request }) => {
        requestedQueries.push(new URL(request.url).searchParams.get('query'));

        return HttpResponse.json(
          {
            isSuccess: false,
            code: 'POLICY_SEARCH_002',
            message: '혜자는 주거 관련 혜택을 알려드려요.',
            result: null,
          },
          { status: 400 },
        );
      }),
    );

    return requestedQueries;
  };

  it('다시 시도 대신 검색어를 고치라고 안내하고, 누르면 검색창에 포커스한다', async () => {
    mockNotHousingSearch();
    signInAs(TOKENS.MEMBER);
    const { user } = renderApp(NOT_HOUSING_PATH);

    expect(await screen.findByText(EMPTY_MESSAGES.SEARCH_NOT_HOUSING)).toBeInTheDocument();
    expect(screen.getByText(EMPTY_MESSAGES.SEARCH_NOT_HOUSING_DESCRIPTION)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '다시 시도' })).not.toBeInTheDocument();
    expect(screen.queryByText(EMPTY_MESSAGES.SEARCH)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '검색어 수정' }));

    expect(screen.getByRole('textbox', { name: '정책 검색' })).toHaveFocus();
  });

  it('같은 검색어로 다시 검색해도 요청하지 않는다', async () => {
    const requestedQueries = mockNotHousingSearch();
    signInAs(TOKENS.MEMBER);
    const { user } = renderApp(NOT_HOUSING_PATH);

    expect(await screen.findByText(EMPTY_MESSAGES.SEARCH_NOT_HOUSING)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '검색', exact: true }));

    expect(await screen.findAllByText(EMPTY_MESSAGES.SEARCH_NOT_HOUSING_DESCRIPTION)).toHaveLength(
      2,
    );
    expect(requestedQueries).toEqual(['취업 지원금 알려줘']);
  });
});
