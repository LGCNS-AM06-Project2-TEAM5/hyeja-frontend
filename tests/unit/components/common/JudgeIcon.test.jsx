import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import JudgeIcon from '@/components/common/JudgeIcon';
import { JUDGE_RESULT, JUDGE_RESULT_LABEL } from '@/constants/policy';

describe('JudgeIcon', () => {
  it.each(Object.values(JUDGE_RESULT))(
    '%s 판정을 이름이 있는 원형 아이콘으로 보여 준다',
    (result) => {
      render(<JudgeIcon result={result} size={24} />);

      expect(screen.getByRole('img', { name: JUDGE_RESULT_LABEL[result] })).toHaveStyle({
        width: '24px',
        height: '24px',
        borderRadius: '50%',
      });
    },
  );

  // 정책 상세 판정 카드처럼 옆 글이 길어지는 가로 배치에서 폭만 줄어 타원이 되던 문제
  it('가로 배치에서 옆 글이 길어져도 줄어들지 않는다', () => {
    render(<JudgeIcon result={JUDGE_RESULT.MET} size={24} />);

    expect(screen.getByRole('img', { name: JUDGE_RESULT_LABEL.MET })).toHaveStyle({
      flexShrink: '0',
    });
  });

  it('모르는 판정 값이면 아무것도 그리지 않는다', () => {
    const { container } = render(<JudgeIcon result="UNKNOWN_RESULT" />);

    expect(container).toBeEmptyDOMElement();
  });
});
