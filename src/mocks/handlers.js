import {
  APPLY_PERIOD_TYPE,
  FAVORITE_STATUS,
  JUDGE_RESULT,
  NATIONWIDE_REGION_CODE,
  RECOMMENDATION_GROUP,
} from '@/constants/policy';
import { buildCardNews } from '@/mocks/data/cardNews';
import { CODE_GROUPS } from '@/mocks/data/codes';
import { POLICIES } from '@/mocks/data/policies';
import { getPolicyStringLengthCase } from '@/mocks/data/policyStringLengthCases';
import { TERMS } from '@/mocks/data/terms';
import { buildJudgementReason, buildJudgements, getRecommendationGroup } from '@/mocks/judge';
import { buildAccessToken, findUserByToken, mockStore } from '@/mocks/store';

const ok = (data) => ({ status: 200, data });
const fail = (status, message) => ({ status, data: { message } });

/** 백엔드 EmailVerificationService와 같이 5번 틀리면 1시간 동안 인증을 막는다. */
const MAX_VERIFICATION_FAILURES = 5;
const VERIFICATION_LOCK_MS = 60 * 60 * 1000;

const verificationLocked = (email) => {
  const lockedUntil = mockStore.getState().emailVerificationLocks?.[email];

  return Boolean(lockedUntil && lockedUntil > Date.now());
};

const verificationLockedResponse = () => ({
  status: 429,
  data: {
    isSuccess: false,
    code: 'VERIFY_005',
    message: '인증 시도 횟수를 초과했어요. 1시간 후에 다시 시도해 주세요.',
    result: null,
  },
});

const maskEmail = (email) => {
  const [localPart, domain] = email.split('@');

  return `${localPart.slice(0, 3)}***@${domain}`;
};

const buildRegionListResponse = () => ({
  isSuccess: true,
  code: 'SUCCESS_001',
  message: '시군구 목록 조회에 성공했습니다.',
  result: CODE_GROUPS.regions.map((sido) => ({
    sidoCode: sido.sidoCode,
    sidoName: sido.sidoName,
    sigungu: sido.sigungu.map((region) => ({
      regionCode: region.code,
      sigunguName: region.name,
    })),
  })),
});

const toPublicUser = (user) => ({
  id: user.id,
  email: user.email,
  nickname: user.nickname,
  role: user.role,
  joinedAt: user.joinedAt,
});

/** 백엔드처럼 "서울특별시 마포구" 형태로 만든다. 시·도 전체 코드(끝 000)는 시·도 이름만 쓴다. */
const findRegionName = (regionCode) => {
  const sido = CODE_GROUPS.regions.find((region) =>
    region.sigungu.some((sigungu) => sigungu.code === regionCode),
  );

  if (!sido) {
    return null;
  }
  if (regionCode.endsWith('000')) {
    return sido.sidoName;
  }

  return `${sido.sidoName} ${sido.sigungu.find((sigungu) => sigungu.code === regionCode).name}`;
};

const toInternationalAge = (birthDate) => {
  const birth = new Date(birthDate);
  const today = new Date();
  const hasHadBirthday =
    today.getMonth() > birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());

  return today.getFullYear() - birth.getFullYear() - (hasHadBirthday ? 0 : 1);
};

const emptyToNull = (value) => (value === '' || value === undefined ? null : value);

const findCodeName = (codes, code) => codes.find((item) => item.code === code)?.name ?? null;

/** 목 저장소의 조건(화면 폼 모양)을 백엔드 ProfileResponseDTO 모양으로 바꾼다. 코드와 이름을 같이 준다. */
const toApiProfile = (profile) => ({
  birth: profile.birthDate,
  age: toInternationalAge(profile.birthDate),
  regionCode: profile.regionCode,
  regionName: findRegionName(profile.regionCode),
  employmentCode: profile.employmentCode,
  employmentName: findCodeName(CODE_GROUPS.employments, profile.employmentCode),
  houselessYn: profile.houseless,
  marriageCode: emptyToNull(profile.marriageCode),
  marriageName: findCodeName(CODE_GROUPS.marriages, profile.marriageCode),
  incomeRangeCode: emptyToNull(profile.incomeRange),
  incomeRangeName: findCodeName(CODE_GROUPS.incomeRanges, profile.incomeRange),
  educationCode: emptyToNull(profile.educationCode),
  educationName: findCodeName(CODE_GROUPS.educations, profile.educationCode),
  housingType: emptyToNull(profile.housingType),
  housingTypeName: findCodeName(CODE_GROUPS.housingTypes, profile.housingType),
});

/** 백엔드 조건 요청 본문(가입의 profile, 조건 수정)을 목 저장소의 조건 모양으로 바꾼다. */
const fromProfileRequest = (request) => ({
  birthDate: request.birth,
  sidoCode: request.regionCode.slice(0, 2),
  regionCode: request.regionCode,
  employmentCode: request.employmentCode,
  houseless: request.houselessYn,
  marriageCode: request.marriageCode ?? '',
  incomeRange: request.incomeRangeCode ?? '',
  educationCode: request.educationCode ?? '',
  housingType: request.housingType ?? '',
});

const toProfileResponse = (profile) => ({
  isSuccess: true,
  code: 'SUCCESS_001',
  message: '성공입니다.',
  result: toApiProfile(profile),
});

const remainingDays = (policy) => {
  if (policy.applyPeriodType === APPLY_PERIOD_TYPE.ALWAYS) {
    return Number.MAX_SAFE_INTEGER;
  }

  const end = new Date(policy.applyEndDate);
  const today = new Date();

  return Math.round((end - today) / (1000 * 60 * 60 * 24));
};

const UI_TO_API_CATEGORY = {
  SUBSCRIPTION: 'PURCHASE',
  PUBLIC_HOUSING: 'PUBLIC_RENT',
  ETC_HOUSING: 'OTHER',
};

const API_TO_UI_CATEGORY = Object.fromEntries(
  Object.entries(UI_TO_API_CATEGORY).map(([uiCategory, apiCategory]) => [apiCategory, uiCategory]),
);

const isSidoRegionCode = (regionCode) => regionCode.endsWith('000');

// notice: 백엔드(PolicySyncItemService)는 시·도 코드(예: 11000 서울 전체)를 그 시·도의 시군구 전체로 풀어 저장하고,
//         region_name은 "서울특별시 마포구"처럼 시·도명과 시군구명을 이어서 내려준다. 목 서버도 같은 모양으로 응답한다.
// notice: 목 코드표(src/mocks/data/codes.js)의 시군구만으로 풀기 때문에 서울은 4개 구, 경기는 3개 시군구가 된다.
//         백엔드 목록 응답의 지역 모양이 바뀌면 이 함수만 명세에 맞춘다.
const toApiPolicyRegions = (policy) => {
  if (policy.regionCode === NATIONWIDE_REGION_CODE) {
    return [];
  }

  const sido = CODE_GROUPS.regions.find(
    (region) => region.sidoCode === policy.regionCode.slice(0, 2),
  );
  const sigungus = (sido?.sigungu ?? []).filter((sigungu) =>
    isSidoRegionCode(policy.regionCode)
      ? !isSidoRegionCode(sigungu.code)
      : sigungu.code === policy.regionCode,
  );

  if (sigungus.length === 0) {
    return [{ region_code: policy.regionCode, region_name: policy.regionName }];
  }

  return sigungus
    .map((sigungu) => ({
      region_code: sigungu.code,
      region_name: `${sido.sidoName} ${sigungu.name}`,
    }))
    .sort((first, second) => first.region_code.localeCompare(second.region_code));
};

const toApiPolicyListItem = (policy, user) => ({
  policy_id: String(policy.id),
  policy_name: policy.title,
  category_codes: [UI_TO_API_CATEGORY[policy.subtype] ?? policy.subtype],
  category_names: [findSubtypeName(policy.subtype)],
  regions: toApiPolicyRegions(policy),
  nationwide: policy.regionCode === NATIONWIDE_REGION_CODE,
  apply_end_date: policy.applyEndDate,
  apply_period_code:
    policy.applyPeriodType === APPLY_PERIOD_TYPE.ALWAYS ? 'ALWAYS' : 'SPECIFIC_PERIOD',
  d_day: policy.applyPeriodType === APPLY_PERIOD_TYPE.ALWAYS ? null : remainingDays(policy),
  ...(user
    ? { favorite_yn: getFavorites(user.id).some((favorite) => favorite.policyId === policy.id) }
    : {}),
});

/** 백엔드 FavoriteItemDTO 모양. 관심 목록 응답에는 지역 정보가 없다. */
const toApiFavoriteItem = (favorite, policy) => ({
  favorite_id: policy.id + 1000,
  policy_id: String(policy.id),
  policy_name: policy.title,
  category_codes: [UI_TO_API_CATEGORY[policy.subtype] ?? policy.subtype],
  category_names: [findSubtypeName(policy.subtype)],
  support_content: policy.summary,
  apply_end_date: policy.applyEndDate,
  apply_period_code:
    policy.applyPeriodType === APPLY_PERIOD_TYPE.ALWAYS ? 'ALWAYS' : 'SPECIFIC_PERIOD',
  apply_url: policy.applyUrl,
  created_at: `${favorite.savedAt}T00:00:00`,
});

const SUBTYPE_NAMES = {
  MONTHLY_RENT: '월세',
  JEONSE: '전세',
  SUBSCRIPTION: '청약·구입',
  PUBLIC_HOUSING: '공공임대',
  ETC_HOUSING: '기타 주거',
};

function findSubtypeName(subtype) {
  return SUBTYPE_NAMES[subtype] ?? '기타 주거';
}

const sortPolicies = (policies, sort) => {
  if (sort === 'VIEWS') {
    return [...policies].sort((a, b) => b.viewCount - a.viewCount);
  }

  if (sort === 'LATEST') {
    return [...policies].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  return [...policies].sort((a, b) => remainingDays(a) - remainingDays(b));
};

const getFavorites = (userId) => mockStore.getState().favorites[userId] ?? [];

const getNotifications = (userId) => mockStore.getState().notifications[userId] ?? [];

// notice: 더미 데이터의 UI 문자열 테스트용이다. URL에 필드·길이가 유효할 때만 정책 1건을 대체한다.
// 예: /policies/1?uiTextTestField=title&uiTextTestLength=50
const getActivePolicies = () => {
  if (typeof window === 'undefined') {
    return POLICIES;
  }

  const query = new URLSearchParams(window.location.search);
  const lengthText = query.get('uiTextTestLength');
  const length = lengthText && /^\d+$/.test(lengthText) ? Number(lengthText) : NaN;
  const testPolicy = getPolicyStringLengthCase(query.get('uiTextTestField'), length);

  return testPolicy
    ? POLICIES.map((policy) => (policy.id === testPolicy.id ? testPolicy : policy))
    : POLICIES;
};

const findActivePolicyById = (policyId) =>
  getActivePolicies().find((policy) => policy.id === Number(policyId));

const listPolicies = (params, user) => {
  const { category, sort = 'DEADLINE', onlyEligible, page = 0, size = 8 } = params;
  const subtype = API_TO_UI_CATEGORY[category] ?? category ?? 'ALL';
  let filtered = getActivePolicies().filter(
    (policy) => subtype === 'ALL' || policy.subtype === subtype,
  );

  if (onlyEligible === 'true' || onlyEligible === true) {
    filtered = filtered.filter((policy) => {
      if (!user) {
        return false;
      }
      // 전국 정책은 사는 곳을 가리지 않으니 "나에게 맞는 것만"에서도 늘 남긴다.
      if (policy.regionCode === NATIONWIDE_REGION_CODE) {
        return true;
      }

      const judgements = buildJudgements(policy, user.profile);

      return getRecommendationGroup(judgements) !== RECOMMENDATION_GROUP.IMPOSSIBLE;
    });
  }

  const sorted = sortPolicies(filtered, sort === 'VIEW_COUNT' ? 'VIEWS' : sort);
  const pageNumber = Number(page);
  const pageSize = Number(size);
  const start = pageNumber * pageSize;
  const totalPages = Math.ceil(filtered.length / pageSize);

  return ok({
    isSuccess: true,
    code: 'SUCCESS_001',
    message: '요청에 성공했습니다.',
    result: {
      policies: sorted
        .slice(start, start + pageSize)
        .map((policy) => toApiPolicyListItem(policy, user)),
      page: pageNumber,
      size: pageSize,
      totalElements: sorted.length,
      totalPages,
      hasNext: pageNumber + 1 < totalPages,
    },
  });
};

const JUDGE_RESULT_TO_STATUS = {
  [JUDGE_RESULT.MET]: 'ABLE',
  [JUDGE_RESULT.NOT_MET]: 'DISABLE',
  [JUDGE_RESULT.NEED_CHECK]: 'UNKNOWN',
};

const toApiSearchItem = (policy, judgements, group, user) => ({
  policyId: String(policy.id),
  policyName: policy.title,
  categories: [UI_TO_API_CATEGORY[policy.subtype] ?? policy.subtype],
  applyEndDate: policy.applyEndDate,
  applyPeriod: policy.applyPeriodType === APPLY_PERIOD_TYPE.ALWAYS ? 'ALWAYS' : 'SPECIFIC_PERIOD',
  isFavorite: Boolean(
    user && getFavorites(user.id).some((favorite) => favorite.policyId === policy.id),
  ),
  aiReason: buildJudgementReason(judgements, group),
  status: Object.fromEntries(
    judgements.map((judgement) => [
      judgement.conditionKey.toLowerCase(),
      JUDGE_RESULT_TO_STATUS[judgement.result],
    ]),
  ),
});

const buildPolicySearchResult = (query, user) => {
  const keyword = (query ?? '').trim();
  const matchedSubtype = Object.entries(SUBTYPE_NAMES).find(([, name]) =>
    keyword.includes(name.split('·')[0]),
  );
  // notice: 목 전용으로 주거와 관계없는 검색어 안내 화면을 확인하려고 둔 검색어다(백엔드 400 POLICY_SEARCH_002).
  if (keyword.includes('주거아님')) {
    return {
      status: 400,
      data: {
        isSuccess: false,
        code: 'POLICY_SEARCH_002',
        message: '혜자는 주거 관련 혜택을 알려드려요.',
        result: null,
      },
    };
  }

  // notice: 목 전용으로 후보 0건 화면을 확인하려고 둔 검색어다.
  const isNoCandidateCase = keyword.includes('후보0건');
  const candidates = (isNoCandidateCase ? [] : getActivePolicies()).filter((policy) => {
    // 설계서: 다른 지역 전용 정책은 결과에서 제외한다.
    if (policy.regionCode !== NATIONWIDE_REGION_CODE && user?.profile?.regionCode) {
      const isSameSido = policy.regionCode.slice(0, 2) === user.profile.regionCode.slice(0, 2);
      if (!isSameSido) {
        return false;
      }
    }
    if (matchedSubtype) {
      return policy.subtype === matchedSubtype[0];
    }

    return true;
  });

  const groups = {
    [RECOMMENDATION_GROUP.POSSIBLE]: [],
    [RECOMMENDATION_GROUP.NEED_CHECK]: [],
    [RECOMMENDATION_GROUP.IMPOSSIBLE]: [],
  };

  candidates.slice(0, 20).forEach((policy) => {
    const profile = user?.profile ?? {};
    const judgements = buildJudgements(policy, profile);
    const group = getRecommendationGroup(judgements);

    groups[group].push(toApiSearchItem(policy, judgements, group, user));
  });

  return ok({
    isSuccess: true,
    code: 'SUCCESS_001',
    message: '요청에 성공했습니다.',
    result: {
      approved: groups[RECOMMENDATION_GROUP.POSSIBLE],
      underReview: groups[RECOMMENDATION_GROUP.NEED_CHECK],
      declined: groups[RECOMMENDATION_GROUP.IMPOSSIBLE],
    },
  });
};

const requireUser = (user) => (user ? null : fail(401, '로그인이 필요한 서비스예요'));

const buildCardNewsListResponse = () => {
  const featured = sortPolicies(getActivePolicies(), 'DEADLINE').slice(0, 4);

  return ok({
    isSuccess: true,
    code: 'SUCCESS_001',
    message: '성공입니다.',
    result: featured.map((policy) => ({
      policyId: String(policy.id),
      policyName: policy.title,
      description: policy.summary,
      applyEndDate: policy.applyEndDate,
    })),
  });
};

export const HANDLERS = [
  {
    method: 'post',
    match: (url) => url === '/api/members/login',
    handle: ({ body }) => {
      const user = mockStore
        .getState()
        .users.find((item) => item.email === body.email && !item.deletedAt);

      if (!user || user.password !== body.password) {
        return fail(401, '이메일 또는 비밀번호가 올바르지 않아요');
      }

      const accessToken = buildAccessToken(user.id, user.role);
      mockStore.update((state) => {
        state.revokedTokens = (state.revokedTokens ?? []).filter((token) => token !== accessToken);

        return state;
      });

      return ok({
        accessToken,
        memberId: user.id,
        nickname: user.nickname,
      });
    },
  },
  {
    method: 'post',
    match: (url) => url === '/api/members/email-verifications',
    handle: ({ body }) => {
      const isDuplicated = mockStore.getState().users.some((item) => item.email === body.email);

      if (isDuplicated) {
        return fail(409, '이미 가입된 이메일이에요');
      }

      if (verificationLocked(body.email)) {
        return verificationLockedResponse();
      }

      mockStore.update((state) => {
        state.emailVerifications ??= {};
        state.emailVerifications[body.email] = {
          code: '384021',
          expiresAt: Date.now() + 5 * 60 * 1000,
          verifiedUntil: null,
        };

        return state;
      });

      return ok({ expiresInSeconds: 300 });
    },
  },
  {
    method: 'post',
    match: (url) => url === '/api/members/email-verifications/confirmation',
    handle: ({ body }) => {
      if (verificationLocked(body.email)) {
        return verificationLockedResponse();
      }

      const verification = mockStore.getState().emailVerifications?.[body.email];

      if (!verification || verification.expiresAt <= Date.now()) {
        return fail(400, '인증 코드가 만료됐어요. 다시 받아 주세요');
      }

      if (verification.code !== body.code) {
        const failures = (verification.failures ?? 0) + 1;

        mockStore.update((state) => {
          state.emailVerifications[body.email].failures = failures;

          if (failures >= MAX_VERIFICATION_FAILURES) {
            state.emailVerificationLocks ??= {};
            state.emailVerificationLocks[body.email] = Date.now() + VERIFICATION_LOCK_MS;
          }

          return state;
        });

        if (failures >= MAX_VERIFICATION_FAILURES) {
          return verificationLockedResponse();
        }

        return {
          status: 400,
          data: {
            isSuccess: false,
            code: 'VERIFY_001',
            message: '인증 코드가 일치하지 않아요.',
            result: { remainingAttempts: MAX_VERIFICATION_FAILURES - failures },
          },
        };
      }

      mockStore.update((state) => {
        state.emailVerifications[body.email] = {
          code: null,
          expiresAt: null,
          verifiedUntil: Date.now() + 30 * 60 * 1000,
        };

        return state;
      });

      return ok({ verified: true });
    },
  },
  {
    method: 'post',
    match: (url) => url === '/api/members',
    handle: ({ body }) => {
      const users = mockStore.getState().users;
      const isDuplicated = users.some((item) => item.email === body.email);

      if (isDuplicated) {
        return fail(409, '이미 가입된 이메일이에요');
      }

      const isNicknameDuplicated = users.some((item) => item.nickname === body.nickname);

      if (isNicknameDuplicated) {
        return fail(409, '이미 사용 중인 닉네임이에요');
      }

      const verification = mockStore.getState().emailVerifications?.[body.email];

      if (!verification?.verifiedUntil || verification.verifiedUntil <= Date.now()) {
        return fail(400, '이메일 인증을 먼저 완료해 주세요');
      }

      const created = mockStore.update((state) => {
        const id = state.lastUserId + 1;
        const user = {
          id,
          email: body.email,
          password: body.password,
          nickname: body.nickname,
          role: 'USER',
          joinedAt: new Date().toISOString().slice(0, 10),
          profile: fromProfileRequest(body.profile),
        };

        state.users.push(user);
        state.favorites[id] = [];
        state.notifications[id] = [];
        delete state.emailVerifications[body.email];
        state.lastUserId = id;

        return state;
      });

      const user = created.users.at(-1);

      // 설계서 F-01: 가입하면 자동 로그인 후 조건 등록으로 이어진다.
      return ok({
        accessToken: buildAccessToken(user.id, user.role),
        refreshToken: `mock-refresh-token-${user.id}`,
        user: toPublicUser(user),
      });
    },
  },
  {
    method: 'post',
    match: (url) => url === '/api/members/logout',
    handle: ({ user, authorization }) => {
      if (!user) {
        return {
          status: 401,
          data: {
            isSuccess: false,
            code: 'COMMON_002',
            message: '인증이 필요합니다.',
            result: null,
          },
        };
      }

      const token = authorization.replace('Bearer ', '');
      mockStore.update((state) => {
        state.revokedTokens ??= [];
        if (!state.revokedTokens.includes(token)) {
          state.revokedTokens.push(token);
        }

        return state;
      });

      return ok({
        isSuccess: true,
        code: 'SUCCESS_001',
        message: '로그아웃에 성공했습니다.',
        result: '로그아웃되었습니다.',
      });
    },
  },
  {
    method: 'get',
    match: (url) => url === '/api/members/find-email',
    handle: ({ params }) => {
      const user = mockStore
        .getState()
        .users.find(
          (item) =>
            !item.deletedAt &&
            item.nickname === params.nickname &&
            item.profile?.birthDate === params.birth,
        );

      return user
        ? ok({
            isSuccess: true,
            code: 'SUCCESS_001',
            message: '이메일 찾기에 성공했습니다.',
            result: { email: maskEmail(user.email), joinedAt: user.joinedAt },
          })
        : {
            status: 404,
            data: {
              isSuccess: false,
              code: 'MEMBER_004',
              message: '가입된 정보를 찾을 수 없습니다.',
              result: null,
            },
          };
    },
  },
  {
    method: 'get',
    match: (url) => url === '/api/members/me',
    handle: ({ user }) =>
      requireUser(user) ??
      ok({
        isSuccess: true,
        code: 'SUCCESS_001',
        message: '계정 조회에 성공했습니다.',
        result: {
          memberId: user.id,
          email: user.email,
          nickname: user.nickname,
          createdAt: `${user.joinedAt}T00:00:00.000Z`,
        },
      }),
  },
  {
    method: 'patch',
    match: (url) => url === '/api/members/me/delete',
    handle: ({ user, authorization, body }) => {
      if (!user) {
        return {
          status: 404,
          data: {
            isSuccess: false,
            code: 'MEMBER_001',
            message: '이미 탈퇴했거나 존재하지 않는 회원입니다.',
            result: null,
          },
        };
      }

      // 백엔드와 같이 본인 확인용 비밀번호를 받아 맞을 때만 탈퇴한다.
      if (!body?.password) {
        return {
          status: 400,
          data: { isSuccess: false, code: 'COMMON_003', message: '비밀번호를 입력해 주세요.' },
        };
      }

      if (body.password !== user.password) {
        return {
          status: 400,
          data: { isSuccess: false, code: 'MEMBER_006', message: '비밀번호가 일치하지 않습니다.' },
        };
      }

      mockStore.update((state) => {
        const target = state.users.find((item) => item.id === user.id);
        const deletedAt = new Date().toISOString();
        target.deletedAt = deletedAt;
        target.profile = { ...target.profile, deletedAt };
        delete state.favorites[user.id];
        delete state.notifications[user.id];
        state.revokedTokens ??= [];
        const token = authorization.replace('Bearer ', '');
        if (!state.revokedTokens.includes(token)) {
          state.revokedTokens.push(token);
        }

        return state;
      });

      return ok({
        isSuccess: true,
        code: 'SUCCESS_001',
        message: '회원 탈퇴에 성공했습니다.',
        result: '회원 탈퇴가 완료되었습니다.',
      });
    },
  },
  {
    method: 'get',
    match: (url) => url === '/api/members/me/profile',
    handle: ({ user }) => requireUser(user) ?? ok(toProfileResponse(user.profile)),
  },
  {
    method: 'patch',
    match: (url) => url === '/api/members/me/profile',
    handle: ({ user, body }) => {
      const denied = requireUser(user);
      if (denied) {
        return denied;
      }

      const updated = mockStore.update((state) => {
        const target = state.users.find((item) => item.id === user.id);
        target.profile = fromProfileRequest(body);

        return state;
      });

      return ok(toProfileResponse(updated.users.find((item) => item.id === user.id).profile));
    },
  },
  {
    method: 'get',
    match: (url) => url === '/api/regions',
    handle: () => ok(buildRegionListResponse()),
  },
  {
    method: 'get',
    match: (url) => url === '/api/policies/card-news',
    handle: ({ user }) => requireUser(user) ?? buildCardNewsListResponse(),
  },
  {
    method: 'get',
    match: (url) => url === '/api/policies/card-news/guest',
    handle: buildCardNewsListResponse,
  },
  {
    method: 'get',
    match: (url) => /^\/api\/policies\/card-detail\/[^/]+$/.test(url),
    handle: ({ url, user }) => {
      const policy = findActivePolicyById(url.split('/').at(-1));

      if (!policy) {
        return fail(404, '요청한 정보를 찾을 수 없어요');
      }

      const cardNews = buildCardNews(policy);

      return ok({
        isSuccess: true,
        code: 'SUCCESS_001',
        message: '성공입니다.',
        result: {
          policyId: String(policy.id),
          categoryLabel: cardNews.subtypeName,
          dDay: policy.applyPeriodType === APPLY_PERIOD_TYPE.ALWAYS ? null : remainingDays(policy),
          isAuthenticated: Boolean(user),
          isFavorite: Boolean(
            user && getFavorites(user.id).some((favorite) => favorite.policyId === policy.id),
          ),
          applyUrl: cardNews.applyUrl,
          cards: cardNews.cards.map((card) => ({
            cardNewsId: card.order,
            cardNo: card.order,
            title: card.heading ?? '',
            badges: card.tags ?? [],
            body: card.body ?? '',
          })),
        },
      });
    },
  },
  {
    method: 'get',
    match: (url) => url === '/api/policies/housing',
    handle: ({ params }) => listPolicies(params, null),
  },
  {
    method: 'get',
    match: (url) => url === '/api/policies/housing/me',
    handle: ({ params, user }) => requireUser(user) ?? listPolicies(params, user),
  },
  {
    method: 'get',
    match: (url) => url === '/api/policies/search',
    handle: ({ params, user }) => requireUser(user) ?? buildPolicySearchResult(params.query, user),
  },
  {
    method: 'get',
    match: (url) => /^\/api\/policies\/[^/]+$/.test(url),
    handle: ({ url, user }) => {
      const policy = findActivePolicyById(url.split('/').at(-1));

      if (!policy) {
        return fail(404, '요청한 정보를 찾을 수 없어요');
      }

      const judgements = user ? buildJudgements(policy, user.profile ?? {}) : [];
      const group = judgements.length ? getRecommendationGroup(judgements) : null;
      const resultStatus = {
        [JUDGE_RESULT.MET]: 'ABLE',
        [JUDGE_RESULT.NOT_MET]: 'DISABLE',
        [JUDGE_RESULT.NEED_CHECK]: 'UNKNOWN',
      };
      // 백엔드와 같이 비로그인은 조건별 결과를 주지 않는다(conditions 빈 목록, overallStatus null).
      const conditions = judgements.map((judgement) => ({
        type: judgement.conditionKey,
        status: resultStatus[judgement.result],
        policyCondition: judgement.requirement,
        memberValue: judgement.myValue,
      }));
      const overallStatus = !group
        ? null
        : group === RECOMMENDATION_GROUP.POSSIBLE
          ? 'ABLE'
          : group === RECOMMENDATION_GROUP.IMPOSSIBLE
            ? 'DISABLE'
            : 'UNKNOWN';

      return ok({
        isSuccess: true,
        code: 'SUCCESS_001',
        message: '요청에 성공했습니다.',
        result: {
          policyId: String(policy.id),
          policyName: policy.title,
          categories: [policy.subtype],
          categoryLabels: [findSubtypeName(policy.subtype)],
          apiSubCategory: findSubtypeName(policy.subtype),
          keywords: '',
          description: policy.description,
          supportContent: policy.benefit,
          extraQualification: policy.requirement?.extraQualification ?? '',
          applyPeriod:
            policy.applyPeriodType === APPLY_PERIOD_TYPE.ALWAYS ? 'ALWAYS' : 'SPECIFIC_PERIOD',
          applyPeriodLabel:
            policy.applyPeriodType === APPLY_PERIOD_TYPE.ALWAYS ? '상시' : '특정기간',
          applyStartDate: policy.applyStartDate,
          applyEndDate: policy.applyEndDate,
          applyMethod: policy.applyMethod,
          applyUrl: policy.applyUrl,
          refUrl: policy.applyUrl,
          activeYn: true,
          isFavorite: Boolean(
            user && getFavorites(user.id).some((favorite) => favorite.policyId === policy.id),
          ),
          overallStatus,
          conditions,
        },
      });
    },
  },
  {
    method: 'get',
    match: (url) => url === '/api/terms',
    handle: () =>
      ok({
        isSuccess: true,
        code: 'SUCCESS_001',
        message: '용어 풀이 목록 조회에 성공했습니다.',
        result: TERMS,
      }),
  },
  {
    method: 'get',
    match: (url) => url === '/api/favorite',
    handle: ({ params, user }) => {
      const denied = requireUser(user);
      if (denied) {
        return denied;
      }

      // 백엔드처럼 최근 저장순(저장소 앞쪽이 최근)이고, keyword는 정책명·지원 내용에서 찾는다.
      const keyword = (params.keyword ?? '').trim();
      const page = Math.max(Number(params.page ?? 0), 0);
      const size = Math.max(Number(params.size ?? 8), 1);
      const favorites = getFavorites(user.id)
        .map((favorite) => {
          const policy = findActivePolicyById(favorite.policyId);

          return policy ? toApiFavoriteItem(favorite, policy) : null;
        })
        .filter(Boolean)
        .filter(
          (favorite) =>
            !keyword ||
            favorite.policy_name.includes(keyword) ||
            (favorite.support_content ?? '').includes(keyword),
        );
      const totalPages = Math.ceil(favorites.length / size);

      return ok({
        isSuccess: true,
        code: 'SUCCESS_001',
        message: '성공입니다.',
        result: {
          favorites: favorites.slice(page * size, (page + 1) * size),
          page,
          size,
          totalElements: favorites.length,
          totalPages,
          hasNext: page + 1 < totalPages,
        },
      });
    },
  },
  {
    method: 'post',
    match: (url) => /^\/api\/favorite\/[^/]+$/.test(url),
    handle: ({ url, user }) => {
      const denied = requireUser(user);
      if (denied) {
        return denied;
      }

      const policyId = Number(url.split('/').at(-1));

      mockStore.update((state) => {
        const favorites = state.favorites[user.id] ?? [];

        if (!favorites.some((item) => item.policyId === policyId)) {
          favorites.unshift({
            policyId,
            status: FAVORITE_STATUS.INTEREST,
            savedAt: new Date().toISOString().slice(0, 10),
          });
        }
        state.favorites[user.id] = favorites;

        return state;
      });

      return ok({});
    },
  },
  {
    method: 'delete',
    match: (url) => /^\/api\/favorite\/[^/]+$/.test(url),
    handle: ({ url, user }) => {
      const denied = requireUser(user);
      if (denied) {
        return denied;
      }

      const policyId = Number(url.split('/').at(-1));

      mockStore.update((state) => {
        state.favorites[user.id] = (state.favorites[user.id] ?? []).filter(
          (item) => item.policyId !== policyId,
        );

        return state;
      });

      return ok({});
    },
  },
  {
    method: 'get',
    match: (url) => url === '/api/notification',
    handle: ({ params, user }) => {
      const denied = requireUser(user);
      if (denied) {
        return denied;
      }

      const page = Math.max(Number(params.page ?? 0), 0);
      const size = Math.max(Number(params.size ?? 8), 1);
      const notifications = getNotifications(user.id);
      const totalPages = Math.ceil(notifications.length / size);
      const pageNotifications = notifications.slice(page * size, (page + 1) * size);
      const items = pageNotifications.map((notification) => {
        const policy = findActivePolicyById(notification.policyId);

        return {
          notification_id: notification.id,
          member_id: user.id,
          policy_id: String(notification.policyId),
          policy_name: policy?.title ?? notification.body,
          content: notification.title,
          read_yn: notification.isRead,
          apply_end_date: policy?.applyEndDate ?? null,
          created_at: notification.createdAt,
        };
      });

      return ok({
        isSuccess: true,
        code: 'SUCCESS_001',
        message: '성공입니다.',
        result: {
          notifications: items,
          unread_count: notifications.filter((notification) => !notification.isRead).length,
          page,
          size,
          totalElements: notifications.length,
          totalPages,
          hasNext: page + 1 < totalPages,
        },
      });
    },
  },
  {
    method: 'patch',
    match: (url) => /^\/api\/notification\/\d+\/read$/.test(url),
    handle: ({ url, user }) => {
      const denied = requireUser(user);
      if (denied) {
        return denied;
      }

      const notificationId = Number(url.split('/').at(-2));
      let updatedNotification;

      mockStore.update((state) => {
        const notification = state.notifications[user.id]?.find(
          (item) => item.id === notificationId,
        );
        if (notification) {
          notification.isRead = true;
          updatedNotification = { ...notification };
        }

        return state;
      });

      const policy = findActivePolicyById(updatedNotification?.policyId);

      return ok({
        isSuccess: true,
        code: 'SUCCESS_001',
        message: '성공입니다.',
        result: updatedNotification
          ? {
              notification_id: updatedNotification.id,
              member_id: user.id,
              policy_id: String(updatedNotification.policyId),
              policy_name: policy?.title ?? updatedNotification.body,
              content: updatedNotification.title,
              read_yn: true,
              apply_end_date: policy?.applyEndDate ?? null,
              created_at: updatedNotification.createdAt,
            }
          : null,
      });
    },
  },
  {
    method: 'delete',
    match: (url) => /^\/api\/notification\/\d+$/.test(url),
    handle: ({ url, user }) => {
      const denied = requireUser(user);
      if (denied) {
        return denied;
      }

      const notificationId = Number(url.split('/').at(-1));

      mockStore.update((state) => {
        state.notifications[user.id] = getNotifications(user.id).filter(
          (item) => item.id !== notificationId,
        );

        return state;
      });

      return ok({});
    },
  },
  {
    method: 'post',
    match: (url) => url === '/api/policies/sync',
    handle: ({ user }) => {
      const denied = requireUser(user);
      if (denied) {
        return denied;
      }
      if (user.role !== 'ADMIN') {
        return fail(403, '접근 권한이 없어요');
      }

      return ok({
        isSuccess: true,
        code: 'SUCCESS_001',
        message: '성공입니다.',
        result: `온통청년 주거 정책 ${getActivePolicies().length}건 동기화가 완료되었습니다.`,
      });
    },
  },
];

export const findHandler = (method, url) =>
  HANDLERS.find((handler) => handler.method === method && handler.match(url));

export { findUserByToken };
