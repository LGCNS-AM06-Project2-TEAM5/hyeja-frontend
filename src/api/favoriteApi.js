import { ENDPOINTS } from './endpoints';
import httpClient from './httpClient';
import { APPLY_PERIOD_TYPE, FAVORITE_STATUS, POLICY_PAGE_SIZE } from '@/constants/policy';

/** 백엔드 apply_period_code(ALWAYS·SPECIFIC_PERIOD·CLOSED)를 날짜로 추측하지 않고 그대로 옮긴다. */
const APPLY_PERIOD_CODE_TO_TYPE = {
  ALWAYS: APPLY_PERIOD_TYPE.ALWAYS,
  SPECIFIC_PERIOD: APPLY_PERIOD_TYPE.PERIOD,
  CLOSED: APPLY_PERIOD_TYPE.CLOSED,
};

const toFavorite = (favorite) => ({
  favoriteId: favorite.favorite_id,
  policyId: favorite.policy_id,
  status: FAVORITE_STATUS.INTEREST,
  savedAt: favorite.created_at,
  policy: {
    id: favorite.policy_id,
    title: favorite.policy_name,
    subtype: favorite.category_codes?.[0],
    subtypeName: favorite.category_names?.[0],
    summary: favorite.support_content ?? '',
    applyPeriodType:
      APPLY_PERIOD_CODE_TO_TYPE[favorite.apply_period_code] ?? APPLY_PERIOD_TYPE.PERIOD,
    applyStartDate: null,
    applyEndDate: favorite.apply_end_date,
    applyUrl: favorite.apply_url,
  },
});

const unwrapResult = (response) => response?.result ?? response;

/** 화면의 페이지는 1부터, 백엔드는 0부터 센다. 빈 검색어는 보내지 않아 전체 목록을 받는다. */
export const toFavoriteListParams = ({ keyword, page, size } = {}) => ({
  ...(keyword?.trim() ? { keyword: keyword.trim() } : {}),
  page: Math.max(Number(page ?? 1) - 1, 0),
  size: Number(size ?? POLICY_PAGE_SIZE),
});

/**
 * 백엔드의 ApiResponse/result + snake_case 계약을 화면에서 쓰는 모델로 변환한다.
 * 변환을 API 경계에 두어 훅과 컴포넌트가 서버 필드명에 의존하지 않게 한다.
 * 목록은 서버가 최근 저장순으로 준다.
 */
export const toFavoriteList = (response) => {
  const result = unwrapResult(response) ?? {};

  return {
    content: (result.favorites ?? []).map(toFavorite),
    page: Number(result.page ?? 0) + 1,
    size: Number(result.size ?? POLICY_PAGE_SIZE),
    totalCount: Number(result.totalElements ?? 0),
    totalPages: Number(result.totalPages ?? 0),
    hasNext: Boolean(result.hasNext),
  };
};

export const getFavorites = async (params) =>
  toFavoriteList(
    await httpClient.get(ENDPOINTS.FAVORITE.LIST, { params: toFavoriteListParams(params) }),
  );

export const addFavorite = (policyId) => httpClient.post(ENDPOINTS.FAVORITE.DETAIL(policyId));

export const removeFavorite = (policyId) => httpClient.delete(ENDPOINTS.FAVORITE.DETAIL(policyId));
