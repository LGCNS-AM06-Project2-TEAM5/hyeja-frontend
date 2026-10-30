/**
 * 설계서 S-04의 필드명을 그대로 쓴다.
 * 지역은 GET /api/regions에서 받고, 나머지는 백엔드 enum과 같은 고정 코드표를 쓴다.
 */
export const CONDITION_FIELDS = {
  BIRTH_DATE: 'birthDate',
  SIDO_CODE: 'sidoCode',
  REGION_CODE: 'regionCode',
  EMPLOYMENT_CODE: 'employmentCode',
  HOUSELESS: 'houseless',
  MARRIAGE_CODE: 'marriageCode',
  INCOME_RANGE: 'incomeRange',
  EDUCATION_CODE: 'educationCode',
  HOUSING_TYPE: 'housingType',
};

export const REQUIRED_CONDITION_FIELDS = [
  CONDITION_FIELDS.BIRTH_DATE,
  CONDITION_FIELDS.REGION_CODE,
  CONDITION_FIELDS.EMPLOYMENT_CODE,
  CONDITION_FIELDS.HOUSELESS,
];

export const OPTIONAL_CONDITION_FIELDS = [
  CONDITION_FIELDS.MARRIAGE_CODE,
  CONDITION_FIELDS.INCOME_RANGE,
  CONDITION_FIELDS.EDUCATION_CODE,
  CONDITION_FIELDS.HOUSING_TYPE,
];

export const INITIAL_CONDITION_FORM = {
  [CONDITION_FIELDS.BIRTH_DATE]: '',
  [CONDITION_FIELDS.SIDO_CODE]: '',
  [CONDITION_FIELDS.REGION_CODE]: '',
  [CONDITION_FIELDS.EMPLOYMENT_CODE]: '',
  [CONDITION_FIELDS.HOUSELESS]: null,
  [CONDITION_FIELDS.MARRIAGE_CODE]: '',
  [CONDITION_FIELDS.INCOME_RANGE]: '',
  [CONDITION_FIELDS.EDUCATION_CODE]: '',
  [CONDITION_FIELDS.HOUSING_TYPE]: '',
};

/** 설계서에 적힌 필드별 안내 문구 */
export const CONDITION_HELPER_TEXTS = {
  [CONDITION_FIELDS.BIRTH_DATE]: '나이는 저장하지 않고 매번 계산해요',
  [CONDITION_FIELDS.REGION_CODE]: '주민등록 주소 기준으로 골라 주세요',
  [CONDITION_FIELDS.EMPLOYMENT_CODE]: '선택지는 온통청년 코드정의서 값이에요',
  [CONDITION_FIELDS.HOUSELESS]: '추가 자격 문장을 판정할 때 써요',
  [CONDITION_FIELDS.MARRIAGE_CODE]: '비우면 혼인 조건은 "확인 필요"로 알려드려요',
  [CONDITION_FIELDS.INCOME_RANGE]: '비우면 소득 조건은 "확인 필요"로 알려드려요',
  [CONDITION_FIELDS.EDUCATION_CODE]: '비우면 학력 조건은 "확인 필요"로 알려드려요',
  [CONDITION_FIELDS.HOUSING_TYPE]: '추가 자격 문장을 판정할 때 써요',
};

export const HOUSELESS_OPTIONS = [
  { value: true, label: '예, 무주택이에요' },
  { value: false, label: '아니요, 집이 있어요' },
];

/**
 * 시/군/구 "전체"(예: 서울 전체 11000) 코드인지 본다.
 * 판정이 뭉개지지 않게 이 코드는 내 조건으로 고를 수 없다.
 */
export const isWholeRegionCode = (regionCode) => Boolean(regionCode?.endsWith('000'));

/** 값이 비었는지 판단한다. false와 0은 "입력된 값"으로 본다. */
export const isConditionValueBlank = (value) =>
  value === null || value === undefined || value === '';
