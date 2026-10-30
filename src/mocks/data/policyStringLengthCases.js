import { POLICIES } from '@/mocks/data/policies';

/**
 * notice: UI 문자열 경계 테스트 전용 더미 데이터다.
 * 기존 POLICIES에는 합치지 않는다. URL에서 선택한 경우에만 목 응답의 정책 1건을
 * 대체하며, 이름에 적힌 길이만큼 단 하나의 표시 문자열만 바꾼다.
 */
const sourcePolicy = POLICIES[0];
const lengths = [10, 20, 30, 40, 50, 60, 80, 100];

// 공백 없는 짧은 라벨은 줄바꿈이 어려운 경우를, 공백 있는 본문은 일반 줄바꿈을 확인한다.
const textSeeds = {
  compact: '청년주거지원정책신청안내',
  prose: '청년 주거 지원 정책 신청 안내 문구 ',
};

// 필드명은 기존 정책 데이터의 필드명 그대로 사용한다.
const fields = {
  title: 'compact',
  regionName: 'compact',
  organization: 'compact',
  summary: 'prose',
  description: 'prose',
  benefit: 'prose',
  target: 'prose',
  applyMethod: 'prose',
  'requirement.extraQualification': 'prose',
};

const exactText = (length, kind) => {
  const seed = textSeeds[kind];
  const text = seed.repeat(Math.ceil(length / Array.from(seed).length));
  const characters = Array.from(text).slice(0, length);

  // 공백으로 끝나는 케이스도 길이는 유지하면서 화면에 마지막 글자가 보이게 한다.
  if (characters.at(-1) === ' ') {
    characters[characters.length - 1] = '문';
  }

  return characters.join('');
};

const createCase = (field, length, kind) => {
  const value = exactText(length, kind);
  const policy = {
    ...sourcePolicy,
    requirement: { ...sourcePolicy.requirement },
  };

  if (field === 'requirement.extraQualification') {
    policy.requirement.extraQualification = value;
  } else {
    policy[field] = value;
  }

  return policy;
};

/**
 * 사용 예: POLICY_STRING_LENGTH_CASES.title.test_30
 * 첫 단계: test_10~test_50 / 확장 단계: test_60, test_80, test_100.
 * 화면 문제가 발견된 구간은 아래 함수로 5자, 필요하면 1자 간격으로 확인한다.
 */
export const POLICY_STRING_LENGTH_CASES = Object.fromEntries(
  Object.entries(fields).map(([field, kind]) => [
    field,
    Object.fromEntries(
      lengths.map((length) => [`test_${length}`, createCase(field, length, kind)]),
    ),
  ]),
);

// notice: 선택한 길이의 더미 정책을 돌려준다. 기본 케이스 외 길이도 지원한다.
export const getPolicyStringLengthCase = (field, length) => {
  if (!Object.hasOwn(fields, field) || !Number.isInteger(length) || length < 1 || length > 500) {
    return null;
  }

  return (
    POLICY_STRING_LENGTH_CASES[field][`test_${length}`] ?? createCase(field, length, fields[field])
  );
};
