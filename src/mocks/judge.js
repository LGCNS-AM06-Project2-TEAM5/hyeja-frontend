import { JUDGE_RESULT, NATIONWIDE_REGION_CODE, RECOMMENDATION_GROUP } from '@/constants/policy';
import { EMPLOYMENT_CODES, INCOME_RANGE_CODES, REGION_CODES } from '@/mocks/data/codes';

const findRegionName = (regionCode) => {
  if (regionCode === NATIONWIDE_REGION_CODE) {
    return '전국';
  }

  const sido = REGION_CODES.find((item) =>
    item.sigungu.some((sigungu) => sigungu.code === regionCode),
  );

  return sido?.sigungu.find((sigungu) => sigungu.code === regionCode)?.name ?? '';
};

const findIncomeRange = (incomeRange) =>
  INCOME_RANGE_CODES.find((item) => item.code === incomeRange);

const findEmploymentName = (employmentCode) =>
  EMPLOYMENT_CODES.find((item) => item.code === employmentCode)?.name ?? '';

export const calculateAge = (birthDate) => {
  if (!birthDate) {
    return null;
  }

  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthGap = today.getMonth() - birth.getMonth();

  if (monthGap < 0 || (monthGap === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }

  return age;
};

/** 정책 지역이 내 지역을 포함하는지 본다. 시도 단위 공고는 앞 두 자리로 비교한다. */
const isRegionCovered = (policyRegionCode, myRegionCode) => {
  if (policyRegionCode === NATIONWIDE_REGION_CODE) {
    return true;
  }
  if (!myRegionCode) {
    return null;
  }
  if (policyRegionCode.endsWith('000')) {
    return policyRegionCode.slice(0, 2) === myRegionCode.slice(0, 2);
  }

  return policyRegionCode === myRegionCode;
};

const judgeAge = (requirement, profile) => {
  const age = calculateAge(profile.birthDate);

  if (requirement.ageMin === undefined || requirement.ageMax === undefined) {
    return {
      result: JUDGE_RESULT.NEED_CHECK,
      requirement: '공고문에서 확인',
      myValue: '해당 없음',
    };
  }

  const label = `만 ${requirement.ageMin}~${requirement.ageMax}세`;

  if (age === null) {
    return { result: JUDGE_RESULT.NEED_CHECK, requirement: label, myValue: '입력 안 함' };
  }

  const isMet = age >= requirement.ageMin && age <= requirement.ageMax;

  return {
    result: isMet ? JUDGE_RESULT.MET : JUDGE_RESULT.NOT_MET,
    requirement: label,
    myValue: `만 ${age}세`,
  };
};

const judgeRegion = (policy, profile) => {
  const covered = isRegionCovered(policy.regionCode, profile.regionCode);
  const myValue = profile.regionCode ? findRegionName(profile.regionCode) : '입력 안 함';

  if (covered === null) {
    return { result: JUDGE_RESULT.NEED_CHECK, requirement: policy.regionName, myValue };
  }

  return {
    result: covered ? JUDGE_RESULT.MET : JUDGE_RESULT.NOT_MET,
    requirement: policy.regionName,
    myValue,
  };
};

const judgeIncome = (requirement, profile) => {
  if (requirement.incomeMaxRatio === undefined) {
    return {
      result: JUDGE_RESULT.NEED_CHECK,
      requirement: '공고문에서 확인',
      myValue: '해당 없음',
    };
  }

  const label = `중위소득 ${requirement.incomeMaxRatio}% 이하`;
  const myIncome = findIncomeRange(profile.incomeRange);

  if (!myIncome) {
    return { result: JUDGE_RESULT.NEED_CHECK, requirement: label, myValue: '입력 안 함' };
  }

  return {
    result:
      myIncome.medianRatio <= requirement.incomeMaxRatio ? JUDGE_RESULT.MET : JUDGE_RESULT.NOT_MET,
    requirement: label,
    myValue: myIncome.name,
  };
};

const judgeEmployment = (requirement, profile) => {
  const allowed = requirement.employmentCodes;
  const myValue = profile.employmentCode
    ? findEmploymentName(profile.employmentCode)
    : '입력 안 함';

  if (!allowed) {
    return { result: JUDGE_RESULT.MET, requirement: '제한 없음', myValue };
  }
  if (!profile.employmentCode) {
    return {
      result: JUDGE_RESULT.NEED_CHECK,
      requirement: allowed.map(findEmploymentName).join(' · '),
      myValue,
    };
  }

  return {
    result: allowed.includes(profile.employmentCode) ? JUDGE_RESULT.MET : JUDGE_RESULT.NOT_MET,
    requirement: allowed.map(findEmploymentName).join(' · '),
    myValue,
  };
};

const judgeHouseless = (requirement, profile) => {
  const label = requirement.houselessRequired ? '무주택자 (추가 자격)' : '제한 없음';

  if (!requirement.houselessRequired) {
    return { result: JUDGE_RESULT.MET, requirement: label, myValue: '해당 없음' };
  }
  if (profile.houseless === null || profile.houseless === undefined) {
    return { result: JUDGE_RESULT.NEED_CHECK, requirement: label, myValue: '입력 안 함' };
  }

  return {
    result: profile.houseless ? JUDGE_RESULT.MET : JUDGE_RESULT.NOT_MET,
    requirement: label,
    myValue: profile.houseless ? '무주택' : '집이 있어요',
  };
};

/** 설계서 S-06 사이드 카드의 5개 행을 만든다. */
export const buildJudgements = (policy, profile) => {
  const requirement = policy.requirement ?? {};

  return [
    { conditionKey: 'AGE', conditionName: '나이', ...judgeAge(requirement, profile) },
    { conditionKey: 'REGION', conditionName: '지역', ...judgeRegion(policy, profile) },
    { conditionKey: 'INCOME', conditionName: '소득', ...judgeIncome(requirement, profile) },
    { conditionKey: 'EMPLOYMENT', conditionName: '취업', ...judgeEmployment(requirement, profile) },
    { conditionKey: 'HOUSELESS', conditionName: '무주택', ...judgeHouseless(requirement, profile) },
  ];
};

export const getRecommendationGroup = (judgements) => {
  if (judgements.some((judgement) => judgement.result === JUDGE_RESULT.NOT_MET)) {
    return RECOMMENDATION_GROUP.IMPOSSIBLE;
  }
  if (judgements.some((judgement) => judgement.result === JUDGE_RESULT.NEED_CHECK)) {
    return RECOMMENDATION_GROUP.NEED_CHECK;
  }

  return RECOMMENDATION_GROUP.POSSIBLE;
};

/** 설계서 S-05의 "왜? / 이유" 한 문장을 만든다. */
export const buildJudgementReason = (judgements, group) => {
  if (group === RECOMMENDATION_GROUP.IMPOSSIBLE) {
    const failed = judgements.find((judgement) => judgement.result === JUDGE_RESULT.NOT_MET);

    return `${failed.requirement}까지 신청할 수 있어요. 내 정보는 ${failed.myValue}예요.`;
  }

  if (group === RECOMMENDATION_GROUP.NEED_CHECK) {
    const unknown = judgements.filter((judgement) => judgement.result === JUDGE_RESULT.NEED_CHECK);

    return `${unknown.map((judgement) => judgement.conditionName).join('·')} 정보를 입력하면 정확히 알려드려요.`;
  }

  return '나이·지역·소득·취업·무주택 조건을 모두 만족해요.';
};
