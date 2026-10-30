import { ENDPOINTS } from './endpoints';
import httpClient from './httpClient';

import {
  APPLY_PERIOD_TYPE,
  ELIGIBILITY_CONDITION_LABELS,
  JUDGE_RESULT,
  POLICY_SUBTYPES,
  RECOMMENDATION_GROUP,
} from '@/constants/policy';

const STATUS_TO_RESULT = {
  ABLE: JUDGE_RESULT.MET,
  DISABLE: JUDGE_RESULT.NOT_MET,
  UNKNOWN: JUDGE_RESULT.NEED_CHECK,
};

const STATUS_TO_GROUP = {
  ABLE: RECOMMENDATION_GROUP.POSSIBLE,
  DISABLE: RECOMMENDATION_GROUP.IMPOSSIBLE,
  UNKNOWN: RECOMMENDATION_GROUP.NEED_CHECK,
};

const STATUS_SUMMARIES = {
  ABLE: '신청 가능한 조건이에요',
  DISABLE: '충족하지 못한 조건이 있어요',
  UNKNOWN: '직접 확인이 필요한 조건이 있어요',
};

const unwrapResult = (response) => response?.result ?? response;

const CATEGORY_TO_API = {
  SUBSCRIPTION: 'PURCHASE',
  PUBLIC_HOUSING: 'PUBLIC_RENT',
  ETC_HOUSING: 'OTHER',
};

const API_TO_CATEGORY = Object.fromEntries(
  Object.entries(CATEGORY_TO_API).map(([category, apiCategory]) => [apiCategory, category]),
);

const SEARCH_GROUP_KEYS = {
  [RECOMMENDATION_GROUP.POSSIBLE]: 'approved',
  [RECOMMENDATION_GROUP.NEED_CHECK]: 'underReview',
  [RECOMMENDATION_GROUP.IMPOSSIBLE]: 'declined',
};

const SORT_TO_API = {
  VIEWS: 'VIEW_COUNT',
};

/** 백엔드는 검색 후보가 0건이면 HTTP 200에 isSuccess: false, result: null로 알린다. */
const POLICY_SEARCH_EMPTY_CODE = 'POLICY_SEARCH_001';

const isEmptySearchResponse = (response) =>
  response?.isSuccess === false && response?.code === POLICY_SEARCH_EMPTY_CODE;

/** 백엔드는 주거와 관계없는 검색어를 400 POLICY_SEARCH_002로 거절한다. 같은 검색어로 다시 물어도 결과가 같다. */
const POLICY_SEARCH_NOT_HOUSING_CODE = 'POLICY_SEARCH_002';

export const isNotHousingSearchError = (error) =>
  error?.response?.data?.code === POLICY_SEARCH_NOT_HOUSING_CODE;

export const toPolicyListParams = (
  { subtype, sort, onlyMatched, page, size } = {},
  { includeEligibility = false } = {},
) => ({
  ...(subtype && subtype !== 'ALL' ? { category: CATEGORY_TO_API[subtype] ?? subtype } : {}),
  sort: SORT_TO_API[sort] ?? sort ?? 'DEADLINE',
  ...(includeEligibility ? { onlyEligible: Boolean(onlyMatched) } : {}),
  page: Math.max(Number(page ?? 1) - 1, 0),
  size: Number(size ?? 8),
});

export const toPolicyList = (response) => {
  const result = unwrapResult(response) ?? {};

  return {
    content: (result.policies ?? []).map((policy) => ({
      id: policy.policy_id,
      title: policy.policy_name,
      subtype: policy.category_codes?.[0] ?? '',
      subtypeName: policy.category_names?.[0] ?? '기타 주거',
      categoryNames: policy.category_names ?? [],
      regions: policy.regions ?? [],
      nationwide: Boolean(policy.nationwide),
      applyPeriodType:
        policy.apply_period_code === 'ALWAYS' ? APPLY_PERIOD_TYPE.ALWAYS : APPLY_PERIOD_TYPE.PERIOD,
      applyEndDate: policy.apply_end_date,
      remainingDays: policy.d_day,
      isFavorite: Boolean(policy.favorite_yn),
    })),
    page: Number(result.page ?? 0) + 1,
    size: Number(result.size ?? 8),
    totalCount: Number(result.totalElements ?? 0),
    totalPages: Number(result.totalPages ?? 0),
    hasNext: Boolean(result.hasNext),
  };
};

export const toPolicyDetail = (response) => {
  const result = unwrapResult(response);

  if (!result) {
    return null;
  }

  const judgements = (result.conditions ?? []).map((condition) => ({
    conditionKey: condition.type,
    conditionName: ELIGIBILITY_CONDITION_LABELS[condition.type] ?? condition.type,
    result: STATUS_TO_RESULT[condition.status] ?? JUDGE_RESULT.NEED_CHECK,
    requirement: condition.policyCondition,
    myValue: condition.memberValue,
  }));

  return {
    id: result.policyId,
    title: result.policyName,
    subtype: result.categories?.[0] ?? result.apiSubCategory ?? '',
    subtypeName: result.categoryLabels?.[0] ?? result.apiSubCategory ?? '기타 주거',
    categoryLabels: result.categoryLabels ?? [],
    description: result.description ?? '',
    benefit: result.supportContent ?? '',
    extraQualification: result.extraQualification ?? '',
    applyPeriodType:
      result.applyPeriod === 'ALWAYS' ? APPLY_PERIOD_TYPE.ALWAYS : APPLY_PERIOD_TYPE.PERIOD,
    applyPeriodLabel: result.applyPeriodLabel ?? '',
    applyStartDate: result.applyStartDate,
    applyEndDate: result.applyEndDate,
    applyMethod: result.applyMethod ?? '',
    applyUrl: result.applyUrl,
    refUrl: result.refUrl,
    active: result.activeYn,
    isFavorite: Boolean(result.isFavorite),
    judgements,
    judgementSummary: STATUS_SUMMARIES[result.overallStatus] ?? '',
    judgementGroup: STATUS_TO_GROUP[result.overallStatus] ?? null,
  };
};

/** 백엔드는 정책마다 cardNo 1~4를 정해진 주제로 만든다(PolicySyncItemService). */
const CARD_NEWS_COUNT = 4;

const CARD_NEWS_LABELS = {
  1: '무슨 정책인가요',
  2: '누가 받을 수 있나요',
  3: '무엇을 받나요',
  4: '어떻게 신청하나요',
};

export const toCardNewsList = (response) => {
  const result = unwrapResult(response);

  return (Array.isArray(result) ? result : []).map((cardNews) => ({
    policyId: cardNews.policyId,
    title: cardNews.policyName,
    summary: cardNews.description ?? '',
    applyEndDate: cardNews.applyEndDate,
    cardCount: CARD_NEWS_COUNT,
  }));
};

export const toTermsList = (response) => {
  const result = unwrapResult(response);

  return (Array.isArray(result) ? result : []).map((term) => ({
    termId: term.termId,
    term: term.term,
    easyDescription: term.easyDescription ?? '',
    example: term.example ?? '',
  }));
};

export const toCardNewsDetail = (response) => {
  const result = unwrapResult(response);

  if (!result) {
    return null;
  }

  const cardsByOrder = new Map(
    (result.cards ?? []).map((card) => [
      Number(card.cardNo),
      {
        id: card.cardNewsId,
        order: Number(card.cardNo),
        label: CARD_NEWS_LABELS[card.cardNo] ?? '',
        heading: card.title ?? '',
        tags: card.badges ?? [],
        body: card.body ?? '',
      },
    ]),
  );

  // 데이터가 없는 장(데모 시드는 1장만 있다)은 번호만 보이는 빈 카드로 채워 항상 4장을 맞춘다.
  const cards = Array.from({ length: CARD_NEWS_COUNT }, (unused, index) => {
    const order = index + 1;

    return (
      cardsByOrder.get(order) ?? {
        id: `empty-${order}`,
        order,
        label: '',
        heading: '',
        tags: [],
        body: '',
      }
    );
  });

  return {
    policyId: result.policyId,
    title: cards[0]?.heading ?? '',
    subtypeName: result.categoryLabel ?? '',
    remainingDays: result.dDay ?? null,
    cardCount: CARD_NEWS_COUNT,
    isAuthenticated: Boolean(result.isAuthenticated),
    isFavorite: Boolean(result.isFavorite),
    applyUrl: result.applyUrl,
    cards,
  };
};

const toPolicySearchItem = (item) => {
  const subtype = API_TO_CATEGORY[item.categories?.[0]] ?? item.categories?.[0] ?? '';

  return {
    id: item.policyId,
    title: item.policyName,
    subtype,
    subtypeName: POLICY_SUBTYPES.find((option) => option.value === subtype)?.label ?? '기타 주거',
    applyPeriodType:
      item.applyPeriod === 'ALWAYS' ? APPLY_PERIOD_TYPE.ALWAYS : APPLY_PERIOD_TYPE.PERIOD,
    applyEndDate: item.applyEndDate,
    isFavorite: Boolean(item.isFavorite),
    reason: item.aiReason ?? '',
    judgements: Object.keys(ELIGIBILITY_CONDITION_LABELS).map((conditionKey) => ({
      conditionKey,
      conditionName: ELIGIBILITY_CONDITION_LABELS[conditionKey],
      result:
        STATUS_TO_RESULT[item.status?.[conditionKey.toLowerCase()]] ?? JUDGE_RESULT.NEED_CHECK,
    })),
  };
};

export const toPolicySearchResult = (response) => {
  const result = isEmptySearchResponse(response) ? {} : (unwrapResult(response) ?? {});

  return {
    groups: Object.fromEntries(
      Object.entries(SEARCH_GROUP_KEYS).map(([group, resultKey]) => [
        group,
        (result[resultKey] ?? []).map(toPolicySearchItem),
      ]),
    ),
  };
};

export const getPolicies = async (params, { isAuthenticated = false } = {}) => {
  const endpoint = isAuthenticated ? ENDPOINTS.POLICY.MEMBER_LIST : ENDPOINTS.POLICY.LIST;

  return toPolicyList(
    await httpClient.get(endpoint, {
      params: toPolicyListParams(params, { includeEligibility: isAuthenticated }),
    }),
  );
};

export const getPolicyDetail = async (policyId) =>
  toPolicyDetail(await httpClient.get(ENDPOINTS.POLICY.DETAIL(policyId)));

export const getCardNews = async ({ isAuthenticated = false, signal } = {}) => {
  const endpoint = isAuthenticated ? ENDPOINTS.POLICY.CARD_NEWS : ENDPOINTS.POLICY.GUEST_CARD_NEWS;

  return toCardNewsList(await httpClient.get(endpoint, { signal }));
};

export const getCardNewsDetail = async (policyId, { signal } = {}) =>
  toCardNewsDetail(await httpClient.get(ENDPOINTS.POLICY.CARD_NEWS_DETAIL(policyId), { signal }));

/** F-14: 백엔드 검색 API는 GET 쿼리스트링으로 검색어를 받고, 로그인이 필요하다. */
export const searchPolicies = async ({ query }) =>
  toPolicySearchResult(await httpClient.get(ENDPOINTS.POLICY.SEARCH, { params: { query } }));

export const getTerms = async ({ signal } = {}) =>
  toTermsList(await httpClient.get(ENDPOINTS.POLICY.TERMS, { signal }));
