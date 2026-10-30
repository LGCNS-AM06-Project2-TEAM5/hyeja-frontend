import { ENDPOINTS } from './endpoints';
import httpClient from './httpClient';
import { tokenStorage } from '@/utils/tokenStorage';

const unwrapResult = (response) => response?.result ?? response;

export const toConditionForm = (profile) => {
  if (!profile) {
    return {};
  }

  return {
    birthDate: profile.birth ?? '',
    sidoCode: profile.regionCode?.slice(0, 2) ?? '',
    regionCode: profile.regionCode ?? '',
    employmentCode: profile.employmentCode ?? '',
    houseless: profile.houselessYn ?? null,
    marriageCode: profile.marriageCode ?? '',
    incomeRange: profile.incomeRangeCode ?? '',
    educationCode: profile.educationCode ?? '',
    housingType: profile.housingType ?? '',
  };
};

/** 홈의 "만 26세 · 서울특별시 마포구 · 무주택 기준으로 찾아요" 문구에 들어갈 요약을 만든다. */
export const toConditionSummary = (profile) =>
  [
    profile?.age == null ? '' : `만 ${profile.age}세`,
    profile?.regionName ?? '',
    profile?.houselessYn === true ? '무주택' : '',
  ]
    .filter(Boolean)
    .join(' · ');

const HOUSELESS_LABELS = { true: '무주택', false: '주택 소유' };

/**
 * 추천 결과의 "적용된 내 조건". 서버가 준 이름으로, 입력한 조건만 보여 준다.
 * 예: 만 27세 · 서울특별시 마포구 · 미취업자 · 무주택 · 월세 거주
 */
export const toAppliedConditions = (profile) =>
  [
    profile?.age == null ? '' : `만 ${profile.age}세`,
    profile?.regionName ?? '',
    profile?.employmentName ?? '',
    HOUSELESS_LABELS[profile?.houselessYn] ?? '',
    profile?.housingTypeName ? `${profile.housingTypeName} 거주` : '',
  ].filter(Boolean);

const emptyToNull = (value) => (value === '' || value === undefined ? null : value);

export const toProfileRequest = (conditionForm) => ({
  birth: conditionForm.birthDate,
  regionCode: conditionForm.regionCode,
  employmentCode: conditionForm.employmentCode,
  houselessYn: conditionForm.houseless,
  marriageCode: emptyToNull(conditionForm.marriageCode),
  incomeRangeCode: emptyToNull(conditionForm.incomeRange),
  educationCode: emptyToNull(conditionForm.educationCode),
  housingType: emptyToNull(conditionForm.housingType),
});

export const toAccount = (response) => {
  const account = unwrapResult(response);

  return {
    id: account.memberId ?? account.id,
    memberId: account.memberId ?? account.id,
    email: account.email,
    nickname: account.nickname,
    joinedAt: (account.createdAt ?? account.joinedAt)?.slice(0, 10),
    role: account.role ?? tokenStorage.getRole() ?? 'USER',
  };
};

export const getMyAccount = async () => toAccount(await httpClient.get(ENDPOINTS.USER.ME));

export const getMyConditions = async () => {
  const profile = unwrapResult(await httpClient.get(ENDPOINTS.USER.PROFILE));

  return {
    conditions: toConditionForm(profile),
    summary: toConditionSummary(profile),
    appliedConditions: toAppliedConditions(profile),
  };
};

export const updateMyConditions = async (conditionForm) =>
  toConditionForm(
    unwrapResult(await httpClient.patch(ENDPOINTS.USER.PROFILE, toProfileRequest(conditionForm))),
  );

/** F-05: 탈퇴하면 조건·관심 정책·알림이 함께 지워진다. 본인 확인용으로 현재 비밀번호를 함께 보낸다. */
export const deleteAccount = async (password) =>
  unwrapResult(await httpClient.patch(ENDPOINTS.USER.DELETE, { password }));
