export const ROUTES = {
  ROOT: '/',
  LANDING: '/landing',
  HOME: '/home',
  SIGNUP: '/signup',
  FIND_EMAIL: '/find-email',
  CONDITION_SETUP: '/conditions',
  SEARCH: '/search',
  POLICY_DETAIL: '/policies/:policyId',
  MY_PAGE: '/mypage',
  NOTIFICATION: '/notifications',
  FAVORITE: '/favorites',
  ADMIN: '/admin',
  NOT_FOUND: '*',
};

export const buildPolicyDetailPath = (policyId) => {
  const path = `/policies/${policyId}`;

  // notice: 더미 데이터의 문자열 테스트 중 정책 상세로 이동해도 선택한 필드와 길이를 유지한다.
  if (import.meta.env.VITE_USE_MOCK !== 'true' || typeof window === 'undefined') {
    return path;
  }

  const currentSearch = new URLSearchParams(window.location.search);
  const field = currentSearch.get('uiTextTestField');
  const length = currentSearch.get('uiTextTestLength');

  if (!field || !length) {
    return path;
  }

  return `${path}?${new URLSearchParams({ uiTextTestField: field, uiTextTestLength: length })}`;
};

export const MY_PAGE_TABS = {
  CONDITION: 'condition',
  ACCOUNT: 'account',
  NOTIFICATION: 'notification',
};

/** 조건 수정은 온보딩(/conditions)이 아니라 마이페이지 탭으로 간다. */
export const buildMyPagePath = (tab) => `${ROUTES.MY_PAGE}?tab=${tab}`;
