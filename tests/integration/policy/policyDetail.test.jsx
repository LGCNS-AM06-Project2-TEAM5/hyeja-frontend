/**
 * I-6 정책 상세 분기 (S-07)
 *
 * notice: 실제 백엔드 없이 MSW가 정책 상세에 응답한다. 판정 결과(judgements)는 fixtures의 고정값이다.
 *         실제 판정은 백엔드 몫이라, 여기서는 "비로그인이면 로그인 안내, 로그인이면 판정 카드"라는
 *         화면 분기만 본다. 판정 규칙 자체의 테스트는 백엔드 저장소에서 한다.
 * notice: 비로그인 상세 응답은 백엔드 PolicyController 설명대로 conditions가 빈 목록, overallStatus가 null이다.
 */
import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { ENDPOINTS } from '@/api/endpoints';
import { JUDGE_RESULT, JUDGE_RESULT_LABEL } from '@/constants/policy';

import { renderApp, signInAs } from '../../helpers/renderApp';
import {
  buildCardNewsDetailResponse,
  MEMBER_CREDENTIALS,
  POLICY,
  TOKENS,
} from '../../msw/fixtures';
import { apiUrl, ok } from '../../msw/respond';
import { server } from '../../msw/server';

const DETAIL_PATH = `/policies/${POLICY.id}`;
const GUEST_CARD_TITLE = '신청 조건 (공고 원문)';
const GUEST_CARD_GUIDE = '로그인하면 내 조건과 비교한 신청 가능 여부를 확인할 수 있어요.';
const JUDGEMENT_CARD_TITLE = '내 조건으로 확인해 봤어요';

const findPolicyTitle = () => screen.findByRole('heading', { name: POLICY.title });

describe('정책 상세 분기', () => {
  it('비로그인이면 조건 표 없이 로그인 안내만 보여 주고 판정 아이콘은 없다', async () => {
    renderApp(DETAIL_PATH);
    await findPolicyTitle();

    expect(screen.getByText(GUEST_CARD_TITLE)).toBeInTheDocument();
    expect(screen.getByText(GUEST_CARD_GUIDE)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '로그인하고 확인하기' })).toBeInTheDocument();
    ['나이', '지역', '소득', '취업'].forEach((conditionName) => {
      expect(screen.queryByText(conditionName)).not.toBeInTheDocument();
    });
    expect(screen.queryByText(JUDGEMENT_CARD_TITLE)).not.toBeInTheDocument();
    expect(screen.queryByRole('img', { name: JUDGE_RESULT_LABEL.MET })).not.toBeInTheDocument();
  });

  it('로그인하면 조건별 판정 카드를 ✓ ✗ ? 아이콘과 함께 보여 준다', async () => {
    signInAs(TOKENS.MEMBER);
    renderApp(DETAIL_PATH);
    await findPolicyTitle();

    // 세션 복구(/me)가 끝나면 상세를 한 번 더 불러오므로, 다시 불러온 뒤의 화면을 한 번에 확인한다.
    await waitFor(() => {
      expect(screen.getByText(JUDGEMENT_CARD_TITLE)).toBeInTheDocument();
      Object.values(JUDGE_RESULT).forEach((result) => {
        expect(screen.getByRole('img', { name: JUDGE_RESULT_LABEL[result] })).toBeInTheDocument();
      });
    });
    expect(screen.queryByText(GUEST_CARD_GUIDE)).not.toBeInTheDocument();
  });

  it('로그인 안내 카드에서 로그인하면 상세를 다시 불러와 판정 카드로 바뀐다', async () => {
    const { user } = renderApp(DETAIL_PATH);
    await findPolicyTitle();

    await user.click(screen.getByRole('button', { name: '로그인하고 확인하기' }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText('이메일'), MEMBER_CREDENTIALS.email);
    await user.type(within(dialog).getByLabelText('비밀번호'), MEMBER_CREDENTIALS.password);
    await user.click(within(dialog).getByRole('button', { name: '로그인' }));

    expect(await screen.findByText(JUDGEMENT_CARD_TITLE)).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText(GUEST_CARD_GUIDE)).not.toBeInTheDocument());
  });

  it('없는 정책이면 오류 상태를 보여 준다', async () => {
    renderApp('/policies/99999');

    expect(await screen.findByRole('alert')).toHaveTextContent('요청한 정보를 찾을 수 없어요');
  });
});

/**
 * notice: 카드뉴스는 정책 상세 응답에 없어서 GET /api/policies/card-detail/{policyId}로 따로 받는다.
 *         카드뉴스가 없으면 백엔드는 404 CARD_NEWS_001을 준다(ErrorStatus.CARD_NEWS_NOT_FOUND).
 */
describe('정책 상세 카드뉴스', () => {
  const recordCardNewsRequests = (respond) => {
    const requestedPolicyIds = [];
    server.use(
      http.get(apiUrl(ENDPOINTS.POLICY.CARD_NEWS_DETAIL(':policyId')), ({ params }) => {
        requestedPolicyIds.push(params.policyId);

        return respond();
      }),
    );

    return requestedPolicyIds;
  };

  it('카드뉴스로 보기를 누르면 이 정책의 카드뉴스를 불러와 팝업으로 보여 준다', async () => {
    const cardNewsResponse = buildCardNewsDetailResponse(POLICY);
    const requestedPolicyIds = recordCardNewsRequests(() => ok(cardNewsResponse));
    const { user } = renderApp(DETAIL_PATH);
    await findPolicyTitle();

    // 누르기 전에는 카드뉴스를 요청하지 않는다.
    expect(requestedPolicyIds).toEqual([]);

    await user.click(screen.getByRole('button', { name: '카드뉴스로 보기' }));

    const dialog = await screen.findByRole('dialog');
    cardNewsResponse.result.cards
      .filter((card) => card.body)
      .forEach((card) => {
        expect(within(dialog).getByText(card.body)).toBeInTheDocument();
      });
    // 이미 상세 화면이라 팝업에 상세로 가는 링크를 두지 않는다.
    expect(within(dialog).queryByRole('link', { name: /정책 상세 보기/ })).not.toBeInTheDocument();
    expect(requestedPolicyIds).toEqual([String(POLICY.id)]);

    await user.click(within(dialog).getByRole('button', { name: '닫기' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('카드뉴스가 없는 정책이면 팝업 대신 안내 토스트를 보여 준다', async () => {
    recordCardNewsRequests(() =>
      HttpResponse.json(
        {
          isSuccess: false,
          code: 'CARD_NEWS_001',
          message: '존재하지 않는 카드뉴스입니다.',
          result: null,
        },
        { status: 404 },
      ),
    );
    const { user } = renderApp(DETAIL_PATH);
    await findPolicyTitle();

    await user.click(screen.getByRole('button', { name: '카드뉴스로 보기' }));

    expect(await screen.findByText('이 정책은 아직 카드뉴스가 없어요')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
