import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import TermText from '@/components/policy/TermText';

describe('TermText', () => {
  it('겹치는 용어는 가장 긴 용어를 우선 표시한다', async () => {
    const user = userEvent.setup();

    render(
      <TermText
        text="무주택세대구성원 요건을 확인하세요."
        terms={[
          { term: '무주택자', easyDescription: '주택을 소유하지 않은 사람' },
          { term: '무주택세대구성원', easyDescription: '세대구성원 모두가 무주택인 상태' },
        ]}
      />,
    );

    await user.hover(screen.getByText('무주택세대구성원'));

    expect(await screen.findByRole('tooltip')).toHaveTextContent('세대구성원 모두가 무주택인 상태');
  });

  it('정규식 특수문자가 포함된 용어도 그대로 찾는다', async () => {
    const user = userEvent.setup();

    render(
      <TermText
        text="보증금(월세) 기준을 확인하세요."
        terms={[{ term: '보증금(월세)', easyDescription: '보증금과 월세를 함께 보는 기준' }]}
      />,
    );

    await user.hover(screen.getByText('보증금(월세)'));

    expect(await screen.findByRole('tooltip')).toHaveTextContent('보증금과 월세를 함께 보는 기준');
  });
});
