import { beforeEach, describe, expect, it } from 'vitest';

import { findHandler } from '@/mocks/handlers';
import { buildAccessToken, findUserByToken, mockStore } from '@/mocks/store';

const searchPolicies = (query) => {
  const user = findUserByToken(`Bearer ${buildAccessToken(1, 'USER')}`);
  const { data } = findHandler('get', '/api/policies/search').handle({ params: { query }, user });

  return [...data.result.approved, ...data.result.underReview, ...data.result.declined];
};

describe('개발용 목 서버 정책 검색', () => {
  beforeEach(() => {
    mockStore.reset();
  });

  it.each([
    ['#월세', 'MONTHLY_RENT'],
    ['#전세', 'JEONSE'],
  ])('해시태그 검색어(%s)는 해당 유형 정책만 돌려준다', (query, category) => {
    const policies = searchPolicies(query);

    expect(policies.length).toBeGreaterThan(0);
    expect(policies.every((policy) => policy.categories[0] === category)).toBe(true);
  });

  it('#이 붙은 검색어와 붙지 않은 검색어의 결과가 같다', () => {
    const toIds = (policies) => policies.map((policy) => policy.policyId);

    expect(toIds(searchPolicies('#월세'))).toEqual(toIds(searchPolicies('월세')));
  });
});
