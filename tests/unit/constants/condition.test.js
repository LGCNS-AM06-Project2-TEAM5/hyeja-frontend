import { describe, expect, it } from 'vitest';

import { isConditionValueBlank, isWholeRegionCode } from '@/constants/condition';

describe('isConditionValueBlank', () => {
  it.each([null, undefined, ''])('%s는 빈 값이다', (value) => {
    expect(isConditionValueBlank(value)).toBe(true);
  });

  it.each([false, 0, 'JOB_SEEKING'])('%s는 입력된 값이다', (value) => {
    expect(isConditionValueBlank(value)).toBe(false);
  });
});

describe('isWholeRegionCode', () => {
  it('000으로 끝나는 시/군/구 "전체" 코드는 true다', () => {
    expect(isWholeRegionCode('11000')).toBe(true);
  });

  it('구체적인 지역 코드는 false다', () => {
    expect(isWholeRegionCode('11440')).toBe(false);
  });

  it.each([undefined, null, ''])('값이 없으면(%s) false다', (regionCode) => {
    expect(isWholeRegionCode(regionCode)).toBe(false);
  });
});
