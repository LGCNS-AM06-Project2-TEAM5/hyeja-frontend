import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import TrendChart from '@/components/admin/TrendChart';

describe('추이 그래프', () => {
  it('null 표본을 가로지르지 않고 시각 간격에 맞춰 선을 끊는다', () => {
    render(
      <TrendChart
        title="요청"
        kind="rate"
        points={[
          { t: 0, v: 1 },
          { t: 30, v: 2 },
          { t: 60, v: null },
          { t: 120, v: 0 },
          { t: 150, v: 1 },
        ]}
      />,
    );
    const svg = screen.getByRole('img', { name: '요청 최근 15분 추이' });
    expect(svg.querySelectorAll('polyline')).toHaveLength(2);
    expect(svg.querySelectorAll('polygon')).toHaveLength(2);
    expect(svg.querySelectorAll('polyline')[1].getAttribute('points')).toContain('80,');
    expect(svg.innerHTML).not.toMatch(/NaN|Infinity/);
  });

  it.each([
    [null, '불러오지 못했어요'],
    [[], '측정 중'],
    [[{ t: 1, v: 0 }], '0.0회/초'],
  ])('실패, 빈 값, 실제 0을 구분한다', (points, message) => {
    render(<TrendChart title="요청" kind="rate" points={points} />);
    expect(screen.getByText(message)).toBeInTheDocument();
  });
});
