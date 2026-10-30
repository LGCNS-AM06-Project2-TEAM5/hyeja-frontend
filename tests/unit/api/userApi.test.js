import { beforeEach, describe, expect, it } from 'vitest';

import { toAccount, toAppliedConditions, toConditionForm, toConditionSummary } from '@/api/userApi';
import { tokenStorage } from '@/utils/tokenStorage';

const encodePayload = (payload) => {
  const value = btoa(JSON.stringify(payload))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `header.${value}.signature`;
};

describe('회원 계정 조회 API', () => {
  beforeEach(() => {
    tokenStorage.setTokens({ accessToken: encodePayload({ sub: '1', role: 'USER' }) });
  });

  it('백엔드 응답을 로그인 회원 모델로 변환한다', () => {
    expect(
      toAccount({
        isSuccess: true,
        code: 'SUCCESS_001',
        message: '성공입니다.',
        result: {
          memberId: 1,
          email: 'member@hyeja.kr',
          nickname: '혜자회원',
          createdAt: '2026-09-27T15:00:42.070Z',
        },
      }),
    ).toEqual({
      id: 1,
      memberId: 1,
      email: 'member@hyeja.kr',
      nickname: '혜자회원',
      joinedAt: '2026-09-27',
      role: 'USER',
    });
  });
});

describe('내 조건 조회 API', () => {
  const profile = {
    birth: '1999-03-12',
    age: 27,
    regionCode: '11440',
    regionName: '서울특별시 마포구',
    employmentCode: 'JOB_SEEKING',
    houselessYn: true,
    marriageCode: null,
    incomeRangeCode: null,
    educationCode: 'BACHELOR',
    housingType: 'MONTHLY_RENT',
  };

  it('백엔드 조건을 수정 폼 모델로 바꾸고, 비어 있는 선택 항목은 빈 문자열로 둔다', () => {
    expect(toConditionForm(profile)).toEqual({
      birthDate: '1999-03-12',
      sidoCode: '11',
      regionCode: '11440',
      employmentCode: 'JOB_SEEKING',
      houseless: true,
      marriageCode: '',
      incomeRange: '',
      educationCode: 'BACHELOR',
      housingType: 'MONTHLY_RENT',
    });
  });

  it('서버가 준 나이·지역 이름·무주택 여부로 조건 요약을 만든다', () => {
    expect(toConditionSummary(profile)).toBe('만 27세 · 서울특별시 마포구 · 무주택');
  });

  it('무주택이 아니면 요약에서 뺀다', () => {
    expect(toConditionSummary({ ...profile, houselessYn: false })).toBe(
      '만 27세 · 서울특별시 마포구',
    );
  });

  it('조건이 없으면 빈 문자열을 준다', () => {
    expect(toConditionSummary(null)).toBe('');
  });
});

describe('추천 결과의 적용된 내 조건', () => {
  const profile = {
    age: 27,
    regionName: '서울특별시 마포구',
    employmentName: '미취업자',
    houselessYn: true,
    housingTypeName: '월세',
  };

  it('서버가 준 이름으로 나이 · 지역 · 취업 · 무주택 · 주거 형태를 차례로 만든다', () => {
    expect(toAppliedConditions(profile)).toEqual([
      '만 27세',
      '서울특별시 마포구',
      '미취업자',
      '무주택',
      '월세 거주',
    ]);
  });

  it('집이 있으면 주택 소유로 보여 준다', () => {
    expect(toAppliedConditions({ ...profile, houselessYn: false })).toContain('주택 소유');
  });

  it('입력하지 않은 선택 항목은 빼고, 조건이 없으면 빈 목록을 준다', () => {
    expect(toAppliedConditions({ ...profile, housingTypeName: null })).toEqual([
      '만 27세',
      '서울특별시 마포구',
      '미취업자',
      '무주택',
    ]);
    expect(toAppliedConditions(null)).toEqual([]);
  });
});
