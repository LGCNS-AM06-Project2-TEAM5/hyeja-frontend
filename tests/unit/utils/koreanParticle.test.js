import { describe, expect, it } from 'vitest';

import { withDirectionParticle } from '@/utils/koreanParticle';

describe('withDirectionParticle', () => {
  it.each([
    ['월세', '월세로'],
    ['공공임대', '공공임대로'],
    ['청약', '청약으로'],
    ['월세 지원', '월세 지원으로'],
    ['서울', '서울로'],
    ['LH', 'LH로'],
  ])('%s → %s', (word, expected) => {
    expect(withDirectionParticle(word)).toBe(expected);
  });
});
