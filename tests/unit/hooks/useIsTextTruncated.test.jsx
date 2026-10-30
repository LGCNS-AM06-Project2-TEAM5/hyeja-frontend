import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useIsTextTruncated } from '@/hooks/useIsTextTruncated';

/** jsdom에는 레이아웃과 ResizeObserver가 없어서, 관찰을 시작하면 바로 한 번 알려 주는 가짜로 둔다. */
class ImmediateResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }

  observe() {
    this.callback([]);
  }

  disconnect() {}
}

const stubTextWidth = ({ scrollWidth, clientWidth }) => {
  vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(scrollWidth);
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(clientWidth);
};

function TruncationProbe({ text }) {
  const { elementRef, isTruncated } = useIsTextTruncated(text);

  return (
    <p ref={elementRef} data-truncated={String(isTruncated)}>
      {text}
    </p>
  );
}

describe('useIsTextTruncated', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('글자가 요소 폭보다 넓으면 잘렸다고 알려 준다', async () => {
    vi.stubGlobal('ResizeObserver', ImmediateResizeObserver);
    stubTextWidth({ scrollWidth: 320, clientWidth: 200 });

    render(<TruncationProbe text="서울특별시 강남구 외 24곳" />);

    await waitFor(() =>
      expect(screen.getByText('서울특별시 강남구 외 24곳')).toHaveAttribute(
        'data-truncated',
        'true',
      ),
    );
  });

  it('글자가 요소 폭 안에 들어가면 잘리지 않았다고 알려 준다', async () => {
    vi.stubGlobal('ResizeObserver', ImmediateResizeObserver);
    stubTextWidth({ scrollWidth: 120, clientWidth: 200 });

    render(<TruncationProbe text="서울특별시 마포구" />);

    await waitFor(() =>
      expect(screen.getByText('서울특별시 마포구')).toHaveAttribute('data-truncated', 'false'),
    );
  });

  it('ResizeObserver가 없는 환경에서는 잘리지 않은 것으로 둔다', () => {
    vi.stubGlobal('ResizeObserver', undefined);
    stubTextWidth({ scrollWidth: 320, clientWidth: 200 });

    render(<TruncationProbe text="서울특별시 강남구 외 24곳" />);

    expect(screen.getByText('서울특별시 강남구 외 24곳')).toHaveAttribute(
      'data-truncated',
      'false',
    );
  });
});
