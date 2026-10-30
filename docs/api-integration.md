# API 연동

프론트엔드가 백엔드 API를 부르고 응답을 화면에 쓰기까지의 규칙을 정리합니다.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="images/architecture/architecture-api-mock-dark.png">
  <img src="images/architecture/architecture-api-mock.png" alt="API 연동 · 목 모드 구조">
</picture>

## 요청이 흐르는 길

```text
pages  →  hooks  →  api  →  httpClient  →  Spring Boot API
(화면)    (조회 상태)  (경로 · 변환)  (axios)
```

- 컴포넌트는 axios를 직접 부르지 않습니다. 화면은 훅을, 훅은 `src/api/*Api.js`의 함수를 부릅니다.
- API 경로는 `src/api/endpoints.js` 한 곳에만 있습니다.
- 서버 필드명은 api 계층에서 끝납니다. 훅과 컴포넌트는 `policy_name` 같은 서버 필드명을 모릅니다.

## httpClient

`src/api/httpClient.js`의 axios 인스턴스 하나를 모든 요청이 함께 씁니다.

| 항목          | 값                                                                              |
| ------------- | ------------------------------------------------------------------------------- |
| baseURL       | `VITE_API_BASE_URL`                                                             |
| timeout       | 10초 (정책 수집만 10분)                                                         |
| 요청 가로채기 | `localStorage`의 accessToken을 `Authorization: Bearer ...`로 붙인다             |
| 응답 가로채기 | `response.data`만 돌려준다                                                      |
| 401 응답      | 토큰을 지우고 `hyeja:unauthorized` 이벤트를 보낸다 → `AuthProvider`가 세션 정리 |

## 응답 변환

백엔드는 모든 응답을 `{ isSuccess, code, message, result }` 봉투에 담아 보냅니다.
각 api 파일의 `unwrapResult`가 `result`를 꺼내고, `toXxx` 함수가 화면 모델로 바꿉니다.

```js
// src/api/policyApi.js
export const getPolicies = async (params, { isAuthenticated = false } = {}) => {
  const endpoint = isAuthenticated ? ENDPOINTS.POLICY.MEMBER_LIST : ENDPOINTS.POLICY.LIST;

  return toPolicyList(
    await httpClient.get(endpoint, {
      params: toPolicyListParams(params, { includeEligibility: isAuthenticated }),
    }),
  );
};
```

| 바꾸는 것      | 서버                                    | 화면                                                  |
| -------------- | --------------------------------------- | ----------------------------------------------------- |
| 필드명         | `policy_name` · `d_day` · `favorite_yn` | `title` · `remainingDays` · `isFavorite`              |
| 페이지 번호    | 0부터                                   | 1부터 (`toPolicyListParams` · `toFavoriteListParams`) |
| 정책 유형      | `PURCHASE` · `PUBLIC_RENT` · `OTHER`    | `SUBSCRIPTION` · `PUBLIC_HOUSING` · `ETC_HOUSING`     |
| 정렬           | `VIEW_COUNT`                            | `VIEWS`                                               |
| 조건 판정      | `ABLE` · `DISABLE` · `UNKNOWN`          | `MET` · `NOT_MET` · `NEED_CHECK`                      |
| 검색 결과 그룹 | `approved` · `underReview` · `declined` | 받을 수 있어요 · 확인이 필요해요 · 아쉽게 안 돼요     |

## 엔드포인트

`src/api/endpoints.js` 기준입니다. 경로를 바꿀 때는 `src/mocks/handlers.js`도 함께 고칩니다(목 핸들러가 경로 문자열을 직접 비교합니다).

### 회원 · 인증

| 기능                  | 메서드 · 경로                                        | 비고                                                                                          |
| --------------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 이메일 인증 코드 발송 | `POST /api/members/email-verifications`              | 60초 뒤 재발송, 코드 6자리                                                                    |
| 인증 코드 확인        | `POST /api/members/email-verifications/confirmation` | 틀리면 남은 기회를 함께 받고, 5번 틀리면 1시간 잠금                                           |
| 회원가입              | `POST /api/members`                                  | 계정과 조건(profile)을 한 번에 저장한 뒤 자동 로그인                                          |
| 로그인                | `POST /api/members/login`                            | 토큰만 받고 계정 정보는 `/api/members/me`로 채운다                                            |
| 로그아웃              | `POST /api/members/logout`                           | 요청이 실패해도(만료 토큰 등) 기기 세션은 정리한다                                            |
| 이메일 찾기           | `GET /api/members/find-email?nickname=&birth=`       |                                                                                               |
| 내 계정               | `GET /api/members/me`                                | 새로고침 때 세션 복원                                                                         |
| 내 조건 조회 · 수정   | `GET` · `PATCH /api/members/me/profile`              | 조건이 없으면 `PROFILE_001` → `/conditions`                                                   |
| 회원 탈퇴             | `PATCH /api/members/me/delete`                       | 본문 `{ password }`로 본인 확인(틀리면 `MEMBER_006`). 조건 · 관심 정책 · 알림이 함께 지워진다 |
| 지역 선택지           | `GET /api/regions`                                   | 나머지 선택지는 `src/constants/profileCodes.js`                                               |

### 정책

| 기능                 | 메서드 · 경로                                      | 비고                                  |
| -------------------- | -------------------------------------------------- | ------------------------------------- |
| 정책 목록 (비로그인) | `GET /api/policies/housing`                        | `category` · `sort` · `page` · `size` |
| 정책 목록 (로그인)   | `GET /api/policies/housing/me`                     | 위 파라미터 + `onlyEligible`          |
| 정책 상세            | `GET /api/policies/{policyId}`                     | 로그인이면 조건별 판정 포함           |
| 카드뉴스 목록        | `GET /api/policies/card-news` · `/card-news/guest` | 로그인 여부로 경로를 고른다           |
| 카드뉴스 상세        | `GET /api/policies/card-detail/{policyId}`         | 빈 장을 채워 항상 4장으로 맞춘다      |
| 맞춤 검색            | `GET /api/policies/search?query=`                  | 로그인 필요. 결과는 3그룹             |
| 용어 풀이            | `GET /api/terms`                                   |                                       |

### 관심 정책 · 알림 · 관리자

| 기능             | 메서드 · 경로                                   | 비고                                                |
| ---------------- | ----------------------------------------------- | --------------------------------------------------- |
| 관심 목록        | `GET /api/favorite?keyword=&page=&size=`        | 빈 검색어는 보내지 않는다                           |
| 관심 저장 · 해제 | `POST` · `DELETE /api/favorite/{policyId}`      |                                                     |
| 알림 목록        | `GET /api/notification?page=&size=`             | 전체 기준 `unread_count`를 함께 받는다              |
| 알림 읽음        | `PATCH /api/notification/{notificationId}/read` |                                                     |
| 알림 삭제        | `DELETE /api/notification/{notificationId}`     |                                                     |
| 정책 수집        | `POST /api/policies/sync`                       | 관리자 전용. 정책마다 AI 분석이라 10분까지 기다린다 |

## 에러 처리

오류 문구는 `src/utils/getErrorMessage.js`가 정합니다.
API 코드별 문구 → 서버 `message` → HTTP 상태별 문구 → 기본 문구 순서로 고르고,
응답이 없으면 타임아웃 · 네트워크 문구를 씁니다. 요청 취소(`ERR_CANCELED`)는 화면에 띄우지 않습니다.

화면이 코드를 보고 흐름을 바꾸는 경우는 다음과 같습니다.

| 코드                | 상황                                          | 화면 동작                                            |
| ------------------- | --------------------------------------------- | ---------------------------------------------------- |
| `401`               | 토큰 만료 · 무효                              | 토큰과 검색 캐시를 지우고 로그아웃 상태로 돌린다     |
| `PROFILE_001`       | 조건을 등록하지 않은 회원                     | 조건 등록(`/conditions`)으로 보낸다                  |
| `POLICY_SEARCH_001` | 검색 후보 0건 (HTTP 200 실패 봉투)            | 빈 결과와 안내 토스트를 보여 준다                    |
| `POLICY_SEARCH_002` | 주거와 관계없는 검색어 (400)                  | 안내 화면을 보여 주고 같은 검색어는 다시 묻지 않는다 |
| `FAVORITE_001`      | 이미 저장한 관심 정책                         | 사용자가 원한 상태이므로 저장된 것으로 맞춘다        |
| `FAVORITE_002`      | 이미 해제한 관심 정책                         | 해제된 것으로 맞춘다                                 |
| `VERIFY_001`        | 인증 코드가 틀림 (`result.remainingAttempts`) | "(남은 기회 N번)"을 오류 문구에 붙인다               |
| `VERIFY_005`        | 인증 코드를 5번 틀림 (429, 1시간 잠금)        | 잠금 안내를 띄우고 인증 코드 입력 · 확인을 막는다    |
| `MEMBER_006`        | 탈퇴 시 비밀번호 불일치                       | 탈퇴 창을 닫지 않고 비밀번호 칸 아래에 안내한다      |
| `POLICY_002`        | 정책 수집이 중간에 멈춤 (502)                 | 멈춘 페이지와 그때까지 저장한 건수를 보여 준다       |

## 아직 없는 것

- **토큰 재발급**: 재발급 API를 쓰지 않습니다. access token이 만료되면 401을 받고 로그아웃 상태가 됩니다.
- **비밀번호 재발급**: 백엔드 API가 없어 화면을 두지 않았습니다. API가 생기면 다시 만듭니다.
- **관심 정책 준비 상태 변경**: 상태 값(`INTEREST` · `PREPARING` · `APPLIED`)은 정의돼 있지만 변경 API는 쓰지 않습니다.

## 새 API를 붙일 때

1. `src/api/endpoints.js`에 경로를 추가합니다.
2. 도메인 api 파일에 호출 함수와 `toXxx` 변환 함수를 만듭니다. 서버 필드명은 여기서 끝냅니다.
3. 훅에서 호출합니다. effect 안에서 조회하고 `isActive` 플래그로 늦게 온 응답을 무시합니다.
4. `src/mocks/handlers.js`에 목 핸들러를 추가합니다. 없으면 목 모드에서 404가 납니다.
5. `tests/msw/handlers.js`에 기본 핸들러를 추가합니다. 없으면 통합 테스트가 `onUnhandledRequest: 'error'`로 실패합니다.
