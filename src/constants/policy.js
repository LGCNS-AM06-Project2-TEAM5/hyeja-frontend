/** 지역 제한이 없는 정책의 지역 코드. 어느 지역에 살든 대상이 된다. */
export const NATIONWIDE_REGION_CODE = 'ALL';

export const POLICY_SUBTYPES = [
  { value: 'ALL', label: '전체' },
  { value: 'MONTHLY_RENT', label: '월세' },
  { value: 'JEONSE', label: '전세' },
  { value: 'SUBSCRIPTION', label: '청약·구입' },
  { value: 'PUBLIC_HOUSING', label: '공공임대' },
  { value: 'ETC_HOUSING', label: '기타 주거' },
];

export const POLICY_SEARCH_HASHTAGS = ['월세', '전세', '청약', '공공임대'];

/** 설계서 S-01 Select/Sort: 마감 임박순 · 조회순 두 가지만 쓴다. */
export const POLICY_SORT_OPTIONS = [
  { value: 'DEADLINE', label: '마감 임박순' },
  { value: 'VIEWS', label: '조회순' },
];

export const APPLY_PERIOD_TYPE = {
  ALWAYS: 'ALWAYS',
  PERIOD: 'PERIOD',
  /** 백엔드가 마감으로 분류한 정책. 관심 정책처럼 마감 뒤에도 남는 목록에서 온다. */
  CLOSED: 'CLOSED',
};

export const JUDGE_RESULT = {
  MET: 'MET',
  NOT_MET: 'NOT_MET',
  NEED_CHECK: 'NEED_CHECK',
};

/** 판정별 색은 theme.js의 palette.judge 경로로만 가리킨다. */
export const JUDGE_RESULT_COLOR = {
  [JUDGE_RESULT.MET]: {
    fill: 'judge.met.fill',
    glyph: 'judge.met.glyph',
    border: 'judge.met.border',
  },
  [JUDGE_RESULT.NOT_MET]: {
    fill: 'judge.notMet.fill',
    glyph: 'judge.notMet.glyph',
    border: 'judge.notMet.border',
  },
  [JUDGE_RESULT.NEED_CHECK]: {
    fill: 'judge.needCheck.fill',
    glyph: 'judge.needCheck.glyph',
    border: 'judge.needCheck.border',
  },
};

/** 백엔드가 회원 조건과 비교해 판정하는 조건(EligibilityConditionType). 화면에도 이 순서로 보여 준다. */
export const ELIGIBILITY_CONDITION_LABELS = {
  AGE: '나이',
  REGION: '지역',
  INCOME: '소득',
  EMPLOYMENT: '취업',
  HOUSELESS: '무주택',
};

export const JUDGE_RESULT_LABEL = {
  [JUDGE_RESULT.MET]: '충족',
  [JUDGE_RESULT.NOT_MET]: '미충족',
  [JUDGE_RESULT.NEED_CHECK]: '확인필요',
};

export const RECOMMENDATION_GROUP = {
  POSSIBLE: 'POSSIBLE',
  NEED_CHECK: 'NEED_CHECK',
  IMPOSSIBLE: 'IMPOSSIBLE',
};

/** 추천 그룹과 종합 판정을 같은 판정 아이콘(✓ · ? · ✗)으로 보여 준다. */
export const JUDGE_RESULT_BY_GROUP = {
  [RECOMMENDATION_GROUP.POSSIBLE]: JUDGE_RESULT.MET,
  [RECOMMENDATION_GROUP.NEED_CHECK]: JUDGE_RESULT.NEED_CHECK,
  [RECOMMENDATION_GROUP.IMPOSSIBLE]: JUDGE_RESULT.NOT_MET,
};

/** 설계서 S-05의 그룹 제목을 그대로 쓴다. */
export const RECOMMENDATION_GROUP_LABEL = {
  [RECOMMENDATION_GROUP.POSSIBLE]: '받을 수 있어요',
  [RECOMMENDATION_GROUP.NEED_CHECK]: '확인이 필요해요',
  [RECOMMENDATION_GROUP.IMPOSSIBLE]: '아쉽게 안 돼요',
};

export const RECOMMENDATION_GROUP_DESCRIPTION = {
  [RECOMMENDATION_GROUP.POSSIBLE]: '조건을 모두 만족하는 정책이에요',
  [RECOMMENDATION_GROUP.NEED_CHECK]: '입력하지 않은 조건이 있거나, 공고문에서 직접 확인이 필요해요',
  [RECOMMENDATION_GROUP.IMPOSSIBLE]: '왜 안 되는지 함께 알려드려요',
};

/** 서버가 관심 정책과 함께 내려주는 상태값. 화면에서는 따로 바꾸지 않는다. */
export const FAVORITE_STATUS = {
  INTEREST: 'INTEREST',
  PREPARING: 'PREPARING',
  APPLIED: 'APPLIED',
};

export const DDAY_IMMINENT_THRESHOLD = 7;
export const POLICY_PAGE_SIZE = 8;
export const SEARCH_KEYWORD_MAX_LENGTH = 200;
