import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useDebounce } from '@/hooks/useDebounce';

const DELAY = 300;

const renderDebounce = (initialValue) =>
  renderHook(({ value }) => useDebounce(value, DELAY), { initialProps: { value: initialValue } });

const advance = (milliseconds) => act(() => vi.advanceTimersByTime(milliseconds));

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useDebounce', () => {
  it('처음에는 받은 값을 바로 돌려준다', () => {
    const { result } = renderDebounce('월세');

    expect(result.current).toBe('월세');
  });

  it('지연 시간이 다 지나야 새 값을 반영한다', () => {
    const { result, rerender } = renderDebounce('월세');

    rerender({ value: '전세' });
    advance(DELAY - 1);
    expect(result.current).toBe('월세');

    advance(1);
    expect(result.current).toBe('전세');
  });

  it('연속으로 바뀌면 마지막 값만 남는다', () => {
    const { result, rerender } = renderDebounce('');

    rerender({ value: '청' });
    advance(DELAY - 100);
    rerender({ value: '청약' });
    advance(DELAY - 100);
    expect(result.current).toBe('');

    advance(100);
    expect(result.current).toBe('청약');
  });

  it('지연 시간을 넘기지 않으면 기본 300ms를 쓴다', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value), {
      initialProps: { value: 'a' },
    });

    rerender({ value: 'b' });
    advance(299);
    expect(result.current).toBe('a');

    advance(1);
    expect(result.current).toBe('b');
  });
});
