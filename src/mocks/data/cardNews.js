import { POLICY_SUBTYPES } from '@/constants/policy';
import { formatDateRange } from '@/utils/formatDate';

const findSubtypeName = (subtype) =>
  POLICY_SUBTYPES.find((option) => option.value === subtype)?.label ?? '기타 주거';

/** 설계서 S-01 카드뉴스 2장: 나이·지역을 칩으로 먼저 보여준다. */
const buildTargetTags = (policy) => {
  const { ageMin, ageMax } = policy.requirement ?? {};
  const tags = [];

  if (ageMin && ageMax) {
    tags.push(`만 ${ageMin}~${ageMax}세`);
  }
  if (policy.regionName) {
    tags.push(policy.regionName);
  }

  return tags;
};

/** 설계서 S-01: 카드뉴스는 정책 하나당 4장으로 구성하고, 4장을 한 번에 보여준다. */
const buildCards = (policy) => [
  {
    order: 1,
    label: '무슨 정책인가요',
    heading: policy.title,
    body: policy.summary,
  },
  {
    order: 2,
    label: '누가 받을 수 있나요',
    tags: buildTargetTags(policy),
    body: policy.target,
  },
  {
    order: 3,
    label: '무엇을 받나요',
    heading: policy.benefit,
    body: policy.description,
  },
  {
    order: 4,
    label: '어떻게 신청하나요',
    heading: formatDateRange(policy.applyStartDate, policy.applyEndDate),
    body: policy.applyMethod,
  },
];

export const buildCardNews = (policy) => ({
  policyId: policy.id,
  title: policy.title,
  subtypeName: findSubtypeName(policy.subtype),
  summary: policy.summary,
  applyPeriodType: policy.applyPeriodType,
  applyStartDate: policy.applyStartDate,
  applyEndDate: policy.applyEndDate,
  applyUrl: policy.applyUrl,
  cardCount: 4,
  cards: buildCards(policy),
});
