/**
 * 통합 테스트용 응답 데이터.
 *
 * notice: 실제 백엔드가 없어서 src/mocks/data의 데모 데이터를 가져다 응답 모양으로 다듬는다.
 * notice: 응답 필드 모양은 src/mocks/handlers.js(목 서버)와 화면 코드가 기대하는 형태를 따른 가정값이다.
 *         백엔드 API 명세가 확정되면 이 파일의 필드명부터 명세에 맞춘다.
 * notice: 판정 결과(judgements)는 목 서버의 판정 로직(src/mocks/judge.js)을 쓰지 않고 고정값으로 둔다.
 *         실제 판정은 백엔드가 하므로, 프론트 테스트는 "받은 판정을 어떻게 보여 주는지"만 본다.
 */
import { APPLY_PERIOD_TYPE, JUDGE_RESULT, POLICY_SUBTYPES } from '@/constants/policy';
import { buildCardNews } from '@/mocks/data/cardNews';
import { CODE_GROUPS } from '@/mocks/data/codes';
import { NOTIFICATIONS } from '@/mocks/data/notifications';
import { POLICIES } from '@/mocks/data/policies';
import { TERMS } from '@/mocks/data/terms';
import { USERS } from '@/mocks/data/users';

const findSubtypeName = (subtype) =>
  POLICY_SUBTYPES.find((option) => option.value === subtype)?.label ?? '기타 주거';

export const toPolicySummary = (policy) => ({
  id: policy.id,
  title: policy.title,
  subtype: policy.subtype,
  subtypeName: findSubtypeName(policy.subtype),
  regionName: policy.regionName,
  organization: policy.organization,
  summary: policy.summary,
  applyPeriodType: policy.applyPeriodType,
  applyStartDate: policy.applyStartDate,
  applyEndDate: policy.applyEndDate,
  viewCount: policy.viewCount,
});

const toPublicUser = (user) => ({
  id: user.id,
  email: user.email,
  nickname: user.nickname,
  role: user.role,
  joinedAt: user.joinedAt,
});

const [MEMBER, ADMIN] = USERS;

export const MEMBER_USER = toPublicUser(MEMBER);
export const ADMIN_USER = toPublicUser(ADMIN);
/** 가입 직후처럼 조건을 아직 등록하지 않은 회원 */
export const NEW_USER = { ...toPublicUser(MEMBER), id: 3, email: 'new@hyeja.kr' };

export const MEMBER_CREDENTIALS = { email: MEMBER.email, password: MEMBER.password };

const findCodeName = (codes, code) => codes.find((item) => item.code === code)?.name ?? null;

/**
 * 백엔드 GET /api/members/me/profile 응답(ProfileResponseDTO). 나이·지역 이름은 서버가 계산해서 주고,
 * 선택지는 코드와 이름을 같이 준다. 등록하지 않은 선택 항목은 코드·이름 모두 null이다.
 */
export const MEMBER_PROFILE_RESPONSE = {
  isSuccess: true,
  code: 'SUCCESS_001',
  message: '성공입니다.',
  result: {
    birth: MEMBER.profile.birthDate,
    age: 27,
    regionCode: MEMBER.profile.regionCode,
    regionName: '서울특별시 마포구',
    employmentCode: MEMBER.profile.employmentCode,
    employmentName: findCodeName(CODE_GROUPS.employments, MEMBER.profile.employmentCode),
    houselessYn: MEMBER.profile.houseless,
    marriageCode: MEMBER.profile.marriageCode,
    marriageName: findCodeName(CODE_GROUPS.marriages, MEMBER.profile.marriageCode),
    incomeRangeCode: null,
    incomeRangeName: null,
    educationCode: MEMBER.profile.educationCode,
    educationName: findCodeName(CODE_GROUPS.educations, MEMBER.profile.educationCode),
    housingType: MEMBER.profile.housingType,
    housingTypeName: findCodeName(CODE_GROUPS.housingTypes, MEMBER.profile.housingType),
  },
};

export const MEMBER_CONDITION_SUMMARY = '만 27세 · 서울특별시 마포구 · 무주택';

export const buildMemberAccountResponse = (member) => ({
  isSuccess: true,
  code: 'SUCCESS_001',
  message: '계정 조회에 성공했습니다.',
  result: {
    memberId: member.id,
    email: member.email,
    nickname: member.nickname,
    createdAt: `${member.joinedAt}T00:00:00.000Z`,
  },
});

export const MEMBER_ACCOUNT_RESPONSE = buildMemberAccountResponse(MEMBER_USER);

export const FIND_EMAIL_RESULT = {
  email: 'min***@hyeja.kr',
  joinedAt: MEMBER.joinedAt,
};

export const TOKENS = {
  MEMBER: 'test.eyJzdWIiOiIxIiwicm9sZSI6IlVTRVIifQ.signature',
  ADMIN: 'test.eyJzdWIiOiIyIiwicm9sZSI6IkFETUlOIn0.signature',
  NEW_USER: 'test.eyJzdWIiOiIzIiwicm9sZSI6IlVTRVIifQ.signature',
};

/** Authorization 헤더의 토큰으로 로그인한 회원을 찾는다. */
export const USER_BY_TOKEN = {
  [TOKENS.MEMBER]: MEMBER_USER,
  [TOKENS.ADMIN]: ADMIN_USER,
  [TOKENS.NEW_USER]: NEW_USER,
};

export const CODES = CODE_GROUPS;

/** 실제 시군구 목록 API의 응답 계약을 재현한다. */
export const REGION_LIST_RESPONSE = {
  isSuccess: true,
  code: 'SUCCESS_001',
  message: '시군구 목록 조회에 성공했습니다.',
  result: CODES.regions.map((sido) => ({
    sidoCode: sido.sidoCode,
    sidoName: sido.sidoName,
    sigungu: sido.sigungu.map((region) => ({
      regionCode: region.code,
      sigunguName: region.name,
    })),
  })),
};

export const TERM_LIST_RESPONSE = {
  isSuccess: true,
  code: 'SUCCESS_001',
  message: '용어 풀이 목록 조회에 성공했습니다.',
  result: TERMS,
};

export const POLICY = POLICIES[0];

export const POLICY_PAGE = {
  content: POLICIES.slice(0, 8).map(toPolicySummary),
  totalCount: POLICIES.length,
  totalPages: Math.ceil(POLICIES.length / 8),
};

const UI_TO_API_CATEGORY = {
  SUBSCRIPTION: 'PURCHASE',
  PUBLIC_HOUSING: 'PUBLIC_RENT',
  ETC_HOUSING: 'OTHER',
};

const toApiPolicyListItem = (policy, { isAuthenticated }) => ({
  policy_id: String(policy.id),
  policy_name: policy.title,
  category_codes: [UI_TO_API_CATEGORY[policy.subtype] ?? policy.subtype],
  category_names: [findSubtypeName(policy.subtype)],
  regions:
    policy.regionCode === 'ALL'
      ? []
      : [{ region_code: policy.regionCode, region_name: policy.regionName }],
  nationwide: policy.regionCode === 'ALL',
  apply_end_date: policy.applyEndDate,
  apply_period_code: policy.applyPeriodType === 'ALWAYS' ? 'ALWAYS' : 'SPECIFIC_PERIOD',
  d_day: null,
  ...(isAuthenticated ? { favorite_yn: policy.id === POLICY.id } : {}),
});

export const buildPolicyList = ({ isAuthenticated }) => ({
  policies: POLICIES.slice(0, 8).map((policy) => toApiPolicyListItem(policy, { isAuthenticated })),
  page: 0,
  size: 8,
  totalElements: POLICIES.length,
  totalPages: Math.ceil(POLICIES.length / 8),
  hasNext: POLICIES.length > 8,
});

export const EMPTY_POLICY_PAGE = { content: [], totalCount: 0, totalPages: 0 };

export const CARD_NEWS_LIST_RESPONSE = {
  isSuccess: true,
  code: 'SUCCESS_001',
  message: '성공입니다.',
  result: POLICIES.slice(0, 4).map((policy) => ({
    policyId: String(policy.id),
    policyName: policy.title,
    description: policy.summary,
    applyEndDate: policy.applyEndDate,
  })),
};

export const buildCardNewsDetailResponse = (policy, { isAuthenticated = false } = {}) => {
  const cardNews = buildCardNews(policy);

  return {
    isSuccess: true,
    code: 'SUCCESS_001',
    message: '성공입니다.',
    result: {
      policyId: String(policy.id),
      categoryLabel: cardNews.subtypeName,
      dDay: null,
      isAuthenticated,
      isFavorite: isAuthenticated && policy.id === POLICY.id,
      applyUrl: cardNews.applyUrl,
      cards: cardNews.cards.map((card) => ({
        cardNewsId: card.order,
        cardNo: card.order,
        title: card.heading ?? '',
        badges: card.tags ?? [],
        body: card.body ?? '',
      })),
    },
  };
};

export const JUDGEMENTS = [
  {
    conditionKey: 'AGE',
    conditionName: '나이',
    result: JUDGE_RESULT.MET,
    requirement: '만 19~34세',
    myValue: '만 27세',
  },
  {
    conditionKey: 'INCOME',
    conditionName: '소득',
    result: JUDGE_RESULT.NEED_CHECK,
    requirement: '기준 중위소득 60% 이하',
    myValue: '입력 안 함',
  },
  {
    conditionKey: 'HOUSELESS',
    conditionName: '무주택',
    result: JUDGE_RESULT.NOT_MET,
    requirement: '무주택자',
    myValue: '주택 보유',
  },
];

const RESULT_TO_API_STATUS = {
  [JUDGE_RESULT.MET]: 'ABLE',
  [JUDGE_RESULT.NOT_MET]: 'DISABLE',
  [JUDGE_RESULT.NEED_CHECK]: 'UNKNOWN',
};

const toApiCondition = (judgement) => ({
  type: judgement.conditionKey,
  status: RESULT_TO_API_STATUS[judgement.result],
  policyCondition: judgement.requirement,
  memberValue: judgement.myValue,
});

/** 실제 정책 상세 API 계약을 재현한다. */
export const buildPolicyDetail = (policy, { isAuthenticated, isFavorite = false }) => ({
  policyId: String(policy.id),
  policyName: policy.title,
  categories: [policy.subtype],
  categoryLabels: [findSubtypeName(policy.subtype)],
  apiSubCategory: findSubtypeName(policy.subtype),
  keywords: '',
  description: policy.description,
  supportContent: policy.benefit,
  extraQualification: policy.requirement?.extraQualification ?? '',
  applyPeriod: policy.applyPeriodType === 'ALWAYS' ? 'ALWAYS' : 'SPECIFIC_PERIOD',
  applyPeriodLabel: policy.applyPeriodType === 'ALWAYS' ? '상시' : '특정기간',
  applyStartDate: policy.applyStartDate,
  applyEndDate: policy.applyEndDate,
  applyMethod: policy.applyMethod,
  applyUrl: policy.applyUrl,
  refUrl: policy.applyUrl,
  activeYn: true,
  isFavorite: isAuthenticated && isFavorite,
  // 비로그인은 조건별 결과를 주지 않는다(conditions 빈 목록, overallStatus null).
  overallStatus: isAuthenticated ? 'DISABLE' : null,
  conditions: isAuthenticated ? JUDGEMENTS.map(toApiCondition) : [],
});

/** 실제 정책 검색 API(PolicySearchResponseDTO) 계약을 재현한다. */
const toSearchItem = (policy, aiReason) => ({
  policyId: String(policy.id),
  policyName: policy.title,
  categories: [UI_TO_API_CATEGORY[policy.subtype] ?? policy.subtype],
  applyEndDate: policy.applyEndDate,
  applyPeriod: policy.applyPeriodType === APPLY_PERIOD_TYPE.ALWAYS ? 'ALWAYS' : 'SPECIFIC_PERIOD',
  isFavorite: false,
  aiReason,
  status: {
    age: 'ABLE',
    region: 'ABLE',
    income: 'UNKNOWN',
    employment: 'ABLE',
    houseless: 'DISABLE',
  },
});

const toSearchResponse = (result) => ({
  isSuccess: true,
  code: 'SUCCESS_001',
  message: '요청에 성공했습니다.',
  result,
});

export const POLICY_SEARCH_RESULT = toSearchResponse({
  approved: [toSearchItem(POLICIES[0], '조건을 모두 만족해요')],
  underReview: [toSearchItem(POLICIES[1], '소득 확인이 필요해요')],
  declined: [toSearchItem(POLICIES[2], '무주택 조건이 달라요')],
});

export const EMPTY_POLICY_SEARCH_RESULT = toSearchResponse({
  approved: [],
  underReview: [],
  declined: [],
});

/** 백엔드는 후보가 0건이면 HTTP 200에 실패 봉투를 준다(ErrorStatus.POLICY_SEARCH_EMPTY). */
export const NO_CANDIDATE_POLICY_SEARCH_RESPONSE = {
  isSuccess: false,
  code: 'POLICY_SEARCH_001',
  message: '조건에 맞는 정책을 찾지 못했어요.',
  result: null,
};

export const FAVORITE_POLICY = POLICIES[1];

/** 백엔드 FavoriteItemDTO. 관심 목록 응답에는 지역 정보가 없다. */
export const toApiFavorite = (policy) => ({
  favorite_id: policy.id + 100,
  policy_id: policy.id,
  policy_name: policy.title,
  category_codes: [policy.subtype],
  category_names: [findSubtypeName(policy.subtype)],
  support_content: policy.summary,
  apply_end_date: policy.applyEndDate,
  apply_period_code: policy.applyPeriodType === 'ALWAYS' ? 'ALWAYS' : 'SPECIFIC_PERIOD',
  apply_url: policy.applyUrl,
  created_at: '2026-09-26T10:30:00',
});

export const buildFavoriteList = (policies, { page = 0, size = 8, totalElements } = {}) => {
  const total = totalElements ?? policies.length;
  const totalPages = Math.ceil(total / size);

  return {
    isSuccess: true,
    code: 'SUCCESS_001',
    message: '성공입니다.',
    result: {
      favorites: policies.map(toApiFavorite),
      page,
      size,
      totalElements: total,
      totalPages,
      hasNext: page + 1 < totalPages,
    },
  };
};

export const FAVORITES = buildFavoriteList([FAVORITE_POLICY]);

export const EMPTY_LIST = { content: [] };

export const NOTIFICATION_LIST = {
  isSuccess: true,
  code: 'SUCCESS_001',
  message: '성공입니다.',
  result: {
    notifications: NOTIFICATIONS.map((notification) => {
      const policy = POLICIES.find((item) => item.id === notification.policyId);

      return {
        notification_id: notification.id,
        member_id: MEMBER_USER.id,
        policy_id: String(notification.policyId),
        policy_name: policy?.title ?? notification.body,
        content: notification.title,
        read_yn: notification.isRead,
        apply_end_date: policy?.applyEndDate ?? null,
        created_at: notification.createdAt,
      };
    }),
    unread_count: NOTIFICATIONS.filter((notification) => !notification.isRead).length,
    page: 0,
    size: 8,
    totalElements: NOTIFICATIONS.length,
    totalPages: 1,
    hasNext: false,
  },
};

/** 백엔드 POST /api/policies/sync 성공 응답. result는 저장 건수를 담은 문구 하나다. */
export const POLICY_SYNC_RESPONSE = {
  isSuccess: true,
  code: 'SUCCESS_001',
  message: '성공입니다.',
  result: '온통청년 주거 정책 142건 동기화가 완료되었습니다.',
};

/** 온통청년 API가 중간에 실패하면 502(POLICY_002)와 함께 멈춘 페이지·저장 건수를 준다. */
export const POLICY_SYNC_STOPPED_RESPONSE = {
  isSuccess: false,
  code: 'POLICY_002',
  message: '온통청년 API 요청이 실패해 정책 수집이 중간에 멈췄어요. 잠시 후 다시 시도해 주세요.',
  result: { stoppedPage: 3, savedCount: 200 },
};
