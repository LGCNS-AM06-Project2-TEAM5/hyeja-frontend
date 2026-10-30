export const EMPLOYMENT_CODES = [
  { code: 'EMPLOYED', name: '재직자' },
  { code: 'SELF_EMPLOYED', name: '자영업자' },
  { code: 'UNEMPLOYED', name: '미취업자' },
  { code: 'FREELANCER', name: '프리랜서' },
  { code: 'DAILY_WORKER', name: '일용근로자' },
  { code: 'ENTREPRENEUR', name: '(예비)창업자' },
  { code: 'SHORT_TERM_WORKER', name: '단기근로자' },
  { code: 'FARMER', name: '영농종사자' },
  { code: 'OTHER', name: '기타' },
];

export const MARRIAGE_CODES = [
  { code: 'SINGLE', name: '미혼' },
  { code: 'MARRIED', name: '기혼' },
];

export const INCOME_RANGE_CODES = [
  { code: 'UNDER_2000', name: '2천만원 미만' },
  { code: 'R2000_3000', name: '2천만원 이상 3천만원 미만' },
  { code: 'R3000_4000', name: '3천만원 이상 4천만원 미만' },
  { code: 'R4000_5000', name: '4천만원 이상 5천만원 미만' },
  { code: 'OVER_5000', name: '5천만원 이상' },
];

export const EDUCATION_CODES = [
  { code: 'BELOW_HIGH_SCHOOL', name: '고졸 미만' },
  { code: 'HIGH_SCHOOL_STUDENT', name: '고교 재학' },
  { code: 'HIGH_SCHOOL_EXPECTED_GRADUATE', name: '고졸 예정' },
  { code: 'HIGH_SCHOOL_GRADUATE', name: '고교 졸업' },
  { code: 'COLLEGE_GRADUATE', name: '대학 졸업' },
  { code: 'COLLEGE_EXPECTED_GRADUATE', name: '대졸 예정' },
  { code: 'COLLEGE_STUDENT', name: '대학 재학' },
  { code: 'MASTER_OR_DOCTOR', name: '석박사' },
  { code: 'OTHER', name: '기타' },
];

export const HOUSING_TYPE_CODES = [
  { code: 'PARENTS', name: '부모님 집' },
  { code: 'MONTHLY_RENT', name: '월세' },
  { code: 'JEONSE', name: '전세' },
  { code: 'OWNED', name: '자가' },
];

export const PROFILE_CODE_GROUPS = {
  employments: EMPLOYMENT_CODES,
  marriages: MARRIAGE_CODES,
  incomeRanges: INCOME_RANGE_CODES,
  educations: EDUCATION_CODES,
  housingTypes: HOUSING_TYPE_CODES,
};
