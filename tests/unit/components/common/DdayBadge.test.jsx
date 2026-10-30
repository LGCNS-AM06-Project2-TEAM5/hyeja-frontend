import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import DdayBadge from '@/components/common/DdayBadge';
import { APPLY_PERIOD_TYPE } from '@/constants/policy';

// 오늘을 2026-09-26 10:00(KST)로 고정한다. applyEndDate로 계산하는 기존 동작을 비교하는 데 쓴다.
const TODAY = new Date(2026, 8, 26, 10, 0, 0);

const findChip = (label) => screen.getByText(label).closest('.MuiChip-root');

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(TODAY);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('DdayBadge 남은 일수(remainingDays)', () => {
  it('음수면 마감으로 표시한다', () => {
    render(<DdayBadge remainingDays={-1} />);

    expect(screen.getByText('마감')).toBeInTheDocument();
  });

  it('백엔드가 마감(CLOSED)으로 준 정책은 마감일이 없어도 마감으로 표시한다', () => {
    render(<DdayBadge applyPeriodType={APPLY_PERIOD_TYPE.CLOSED} applyEndDate={null} />);

    expect(screen.getByText('마감')).toBeInTheDocument();
  });

  it.each([0, 7])('%s일이면 임박 강조로 표시한다', (remainingDays) => {
    render(<DdayBadge remainingDays={remainingDays} />);

    expect(findChip(`D-${remainingDays}`)).toHaveClass('MuiChip-filled', 'MuiChip-colorPrimary');
  });

  it('8일이면 강조하지 않은 회색 채움으로 둔다', () => {
    render(<DdayBadge remainingDays={8} />);

    expect(findChip('D-8')).toHaveClass('MuiChip-filled');
    expect(findChip('D-8')).not.toHaveClass('MuiChip-colorPrimary');
  });

  it('null이면 아무것도 표시하지 않는다', () => {
    const { container } = render(<DdayBadge remainingDays={null} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('applyEndDate가 있어도 remainingDays를 우선한다', () => {
    render(
      <DdayBadge
        applyPeriodType={APPLY_PERIOD_TYPE.PERIOD}
        applyEndDate="2026-09-30"
        remainingDays={10}
      />,
    );

    expect(screen.getByText('D-10')).toBeInTheDocument();
  });
});

describe('DdayBadge 마감일(applyEndDate)', () => {
  it('remainingDays가 없으면 마감일로 남은 일수를 계산한다', () => {
    render(<DdayBadge applyPeriodType={APPLY_PERIOD_TYPE.PERIOD} applyEndDate="2026-09-30" />);

    expect(findChip('D-4')).toHaveClass('MuiChip-filled', 'MuiChip-colorPrimary');
  });

  it('상시 모집은 상시로 표시한다', () => {
    render(<DdayBadge applyPeriodType={APPLY_PERIOD_TYPE.ALWAYS} applyEndDate={null} />);

    expect(screen.getByText('상시')).toBeInTheDocument();
  });

  it('마감일이 없으면 아무것도 표시하지 않는다', () => {
    const { container } = render(<DdayBadge applyPeriodType={APPLY_PERIOD_TYPE.PERIOD} />);

    expect(container).toBeEmptyDOMElement();
  });
});
