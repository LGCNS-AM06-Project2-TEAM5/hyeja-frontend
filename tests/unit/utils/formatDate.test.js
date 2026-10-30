import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { APPLY_PERIOD_TYPE } from '@/constants/policy';
import {
  formatDate,
  formatDateRange,
  formatRelativeTime,
  getRemainingDays,
  isApplyClosed,
  isDeadlineImminent,
} from '@/utils/formatDate';

// 오늘을 2026-09-26 10:00(KST)로 고정한다. setTimeout은 그대로 두고 Date만 가짜로 만든다.
const TODAY = new Date(2026, 8, 26, 10, 0, 0);

const periodPolicy = (applyEndDate) => ({
  applyPeriodType: APPLY_PERIOD_TYPE.PERIOD,
  applyEndDate,
});
const alwaysPolicy = { applyPeriodType: APPLY_PERIOD_TYPE.ALWAYS, applyEndDate: null };

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(TODAY);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('formatDate', () => {
  it('날짜를 ko-KR 형식으로 바꾼다', () => {
    expect(formatDate('2026-09-26')).toBe('2026. 09. 26.');
  });

  it.each([null, '', 'not-a-date'])('값이 없거나 잘못되면(%s) 빈 문자열을 준다', (value) => {
    expect(formatDate(value)).toBe('');
  });
});

describe('formatDateRange', () => {
  it('시작일과 마감일을 물결표로 잇는다', () => {
    expect(formatDateRange('2026-09-01', '2026-09-30')).toBe('2026. 09. 01. ~ 2026. 09. 30.');
  });

  it('둘 다 없으면 상시 모집으로 표시한다', () => {
    expect(formatDateRange(null, null)).toBe('상시 모집');
  });
});

describe('getRemainingDays', () => {
  it.each([
    ['2026-09-26', 0],
    ['2026-09-27', 1],
    ['2026-10-03', 7],
    ['2026-09-25', -1],
  ])('마감일 %s는 D-%i로 계산한다', (endDate, days) => {
    expect(getRemainingDays(endDate)).toBe(days);
  });

  it('시각과 상관없이 날짜만 비교한다 (자정 직전과 직후)', () => {
    vi.setSystemTime(new Date(2026, 8, 26, 23, 59, 59));
    expect(getRemainingDays('2026-09-27')).toBe(1);

    vi.setSystemTime(new Date(2026, 8, 27, 0, 0, 0));
    expect(getRemainingDays('2026-09-27')).toBe(0);
  });

  it.each([null, 'not-a-date'])('마감일이 없거나 잘못되면(%s) null을 준다', (endDate) => {
    expect(getRemainingDays(endDate)).toBeNull();
  });
});

describe('isDeadlineImminent', () => {
  it.each([
    ['오늘 마감', '2026-09-26', true],
    ['7일 남음', '2026-10-03', true],
    ['8일 남음', '2026-10-04', false],
    ['이미 마감', '2026-09-25', false],
  ])('%s이면 %s', (label, endDate, expected) => {
    expect(isDeadlineImminent(periodPolicy(endDate))).toBe(expected);
  });

  it('상시 모집은 임박으로 보지 않는다', () => {
    expect(isDeadlineImminent(alwaysPolicy)).toBe(false);
  });
});

describe('isApplyClosed', () => {
  it('마감일이 지나면 true, 오늘 마감이면 false다', () => {
    expect(isApplyClosed(periodPolicy('2026-09-25'))).toBe(true);
    expect(isApplyClosed(periodPolicy('2026-09-26'))).toBe(false);
  });

  it('상시 모집은 마감되지 않는다', () => {
    expect(isApplyClosed(alwaysPolicy)).toBe(false);
  });

  it('백엔드가 마감(CLOSED)으로 준 정책은 날짜와 관계없이 마감이다', () => {
    expect(isApplyClosed({ applyPeriodType: APPLY_PERIOD_TYPE.CLOSED, applyEndDate: null })).toBe(
      true,
    );
  });
});

describe('formatRelativeTime', () => {
  const minutesAgo = (minutes) => new Date(TODAY.getTime() - minutes * 60 * 1000).toISOString();

  it.each([
    [0.5, '방금 전'],
    [5, '5분 전'],
    [3 * 60, '3시간 전'],
    [2 * 24 * 60, '2일 전'],
  ])('%s분 전은 "%s"로 보여 준다', (minutes, expected) => {
    expect(formatRelativeTime(minutesAgo(minutes))).toBe(expected);
  });

  it('7일이 넘으면 날짜로 보여 준다', () => {
    expect(formatRelativeTime(minutesAgo(8 * 24 * 60))).toBe('2026. 09. 18.');
  });

  it('잘못된 값이면 빈 문자열을 준다', () => {
    expect(formatRelativeTime('not-a-date')).toBe('');
  });
});
