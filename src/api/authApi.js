import { ENDPOINTS } from './endpoints';
import httpClient from './httpClient';
import { tokenStorage } from '@/utils/tokenStorage';

const unwrapResult = (response) => response?.result ?? response;

const emptyToNull = (value) => (value === '' || value === undefined ? null : value);

const toProfileRequest = (profile) => ({
  birth: profile.birthDate,
  regionCode: profile.regionCode,
  employmentCode: profile.employmentCode,
  houselessYn: profile.houseless,
  marriageCode: emptyToNull(profile.marriageCode),
  incomeRangeCode: emptyToNull(profile.incomeRange),
  educationCode: emptyToNull(profile.educationCode),
  housingType: emptyToNull(profile.housingType),
});

const toSession = (credentials, response, account) => {
  const result = unwrapResult(response);
  const memberId = result.memberId ?? account?.memberId;
  const role = tokenStorage.getRole(result.accessToken) ?? account?.role ?? 'USER';

  return {
    accessToken: result.accessToken,
    user: {
      ...account,
      id: memberId,
      memberId,
      email: account?.email ?? credentials.email,
      nickname: result.nickname ?? account?.nickname,
      joinedAt: account?.createdAt?.slice(0, 10),
      role,
    },
  };
};

/**
 * 로그인 응답에는 토큰·회원 번호·닉네임만 있고 이메일·가입일이 없다.
 * 회원 정보는 새로고침으로 세션을 복원할 때처럼 계정 조회(/members/me)로 채운다.
 */
export const login = async (credentials) => {
  const response = await httpClient.post(ENDPOINTS.AUTH.LOGIN, credentials);

  return { accessToken: unwrapResult(response).accessToken };
};

export const sendEmailVerification = async (email) => {
  const response = await httpClient.post(ENDPOINTS.AUTH.EMAIL_VERIFICATION, { email });

  return unwrapResult(response);
};

export const confirmEmailVerification = async (email, code) => {
  const response = await httpClient.post(ENDPOINTS.AUTH.EMAIL_VERIFICATION_CONFIRMATION, {
    email,
    code,
  });

  return unwrapResult(response);
};

export const signup = async ({ profile, ...accountForm }) => {
  const response = await httpClient.post(ENDPOINTS.AUTH.SIGNUP, {
    ...accountForm,
    profile: toProfileRequest(profile),
  });

  if (response?.user) {
    return response;
  }

  const account = unwrapResult(response);
  const loginResponse = await httpClient.post(ENDPOINTS.AUTH.LOGIN, {
    email: accountForm.email,
    password: accountForm.password,
  });

  return toSession(accountForm, loginResponse, account);
};

export const logout = async () => unwrapResult(await httpClient.post(ENDPOINTS.AUTH.LOGOUT));

export const toFindEmailParams = ({ nickname, birth }) => ({ nickname, birth });

export const findEmail = async (form) => {
  const response = await httpClient.get(ENDPOINTS.AUTH.FIND_EMAIL, {
    params: toFindEmailParams(form),
  });

  return unwrapResult(response);
};
