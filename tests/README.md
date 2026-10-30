# 테스트

테스트를 단위 · 통합 · E2E 세 층으로 나눈다. **지금은 세 층 모두 실제 백엔드 없이 돈다.**
백엔드 API 경로와 응답 봉투가 아직 확정되지 않아서다(`src/api/endpoints.js`는 가정값).

| 층   | 위치                 | 도구                                  | 가짜로 두는 것                             |
| ---- | -------------------- | ------------------------------------- | ------------------------------------------ |
| 단위 | `tests/unit/`        | Vitest                                | 없음 (날짜만 고정)                         |
| 통합 | `tests/integration/` | Vitest + Testing Library + user-event | **네트워크만** (MSW, `tests/msw/`)         |
| E2E  | `tests/e2e/`         | Playwright (Chromium)                 | 백엔드 전체 (앱 내장 목 서버, `src/mocks`) |

## 층별로 무엇을 보나

- **단위**: 함수 하나, 작은 훅 하나가 입력에 맞는 값을 돌려주는지. 경계값(닉네임 20자, D-7, 자정)을 꼭 넣는다.
- **통합**: `<App />`을 그대로 띄우고 클릭·입력으로 화면이 맞게 바뀌는지. 화면 · 훅 · api · httpClient는
  실제 코드가 돌고 네트워크만 MSW가 대신한다. 에러(500), 인증 거절(401), 빈 목록 같은 분기를 여기서 본다.
- **E2E**: 실제 브라우저에서 라우팅 · lazy 로딩 · 새로고침 · 저장 유지까지 여정이 끝까지 이어지는지.
  통합에서 이미 본 분기는 반복하지 않는다.

## 목 기반으로 검증하는 범위 (기억할 것)

통합과 E2E는 **백엔드가 이렇게 응답할 것이라는 가정** 위에서 통과한다. 각 파일 맨 위 `notice:` 주석에
무엇이 가정인지 적어 두었다.

| 가정                                                                           | 위치                                                    | 백엔드 확정 후 할 일                                                                            |
| ------------------------------------------------------------------------------ | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| 응답 본문을 봉투 없이 그대로 데이터로 쓴다                                     | `tests/msw/respond.js`                                  | 봉투(`{ isSuccess, code, message, result }`)에 맞춰 `ok`·`fail`만 수정                          |
| API 경로                                                                       | `src/api/endpoints.js`                                  | 경로를 고치면 MSW 핸들러는 자동으로 따라간다                                                    |
| 응답 필드 모양 (정책 요약, 판정, 추천 그룹 등)                                 | `tests/msw/fixtures.js`                                 | 명세에 맞춰 필드명 수정. 테스트 본문은 그대로 둔다                                              |
| 판정 결과는 고정값이다 (판정 규칙은 테스트하지 않음)                           | `tests/msw/fixtures.js` `JUDGEMENTS`                    | 판정 규칙 테스트는 백엔드 저장소에서 한다                                                       |
| E2E 로그인 계정은 목 계정이다                                                  | `tests/e2e/support/accounts.js`                         | 실서버용 테스트 계정을 환경 변수로 읽도록 수정                                                  |
| E2E의 "새로고침 후 유지"는 localStorage 기준이다                               | `src/mocks/store.js`                                    | 실서버에서는 서버 DB 기준이 된다                                                                |
| 정책 지역은 시·도 코드를 시군구 전체로 풀어 내려 준다                          | `tests/integration/policy/policyRegionSummary.test.jsx` | 백엔드 응답 모양이 바뀌면 `REGIONS` 값을 명세에 맞춰 수정                                       |
| 카드뉴스 상세는 남은 일수를 `dDay`(마감일 없으면 `null`)로만 준다              | `tests/integration/policy/cardNews.test.jsx`            | 키가 바뀌면 `fixtures.buildCardNewsDetailResponse`와 `toCardNewsDetail` 수정                    |
| 검색 후보 0건은 HTTP 200 + `POLICY_SEARCH_001` 실패 봉투로 온다                | `tests/integration/search/policySearch.test.jsx`        | 코드·상태가 바뀌면 `fixtures.NO_CANDIDATE_POLICY_SEARCH_RESPONSE`와 `toPolicySearchResult` 수정 |
| 정책 수집이 멈추면 502 `POLICY_002`와 `result.stoppedPage`·`savedCount`가 온다 | `tests/integration/admin/policySync.test.jsx`           | 모양이 바뀌면 `fixtures.POLICY_SYNC_STOPPED_RESPONSE`와 `adminApi.toPolicySyncStop` 수정        |
| 주거와 관계없는 검색어는 400 `POLICY_SEARCH_002`로 거절된다                    | `tests/integration/search/policySearch.test.jsx`        | 코드·상태가 바뀌면 `policyApi.isNotHousingSearchError`와 테스트 응답 수정                       |

`src/mocks/judge.js`(목 서버의 판정 로직)는 일부러 테스트하지 않는다. 실제 판정은 백엔드가 하므로,
목 서버 내부를 테스트해도 제품 품질과 관계가 없다.

## 테스트 추가하는 방법

### 단위

- `src` 경로를 그대로 따라 둔다. 예: `src/utils/formatDate.js` → `tests/unit/utils/formatDate.test.js`
- `describe`, `it`, `expect`는 `vitest`에서 import한다(전역 API를 쓰지 않는다).
- 날짜는 `vi.useFakeTimers({ toFake: ['Date'] })` + `vi.setSystemTime`으로 고정한다. **단위 테스트에서만 쓴다.**
  목 데이터 날짜(`dateFromToday`)는 import 시점에 계산되므로, 통합 테스트에서 시간을 고정하면 서로 어긋난다.
- 시간대는 `vitest.config.js`에서 `Asia/Seoul`로 고정돼 있다.

### 통합

- 시나리오 단위로 둔다. 예: `tests/integration/auth/loginDialog.test.jsx`
- `renderApp(route)`로 시작하고, 로그인 상태가 필요하면 먼저 `signInAs(TOKENS.MEMBER)`를 부른다.
- 요소는 `getByRole` · `getByLabelText`로 찾는다. `data-testid`는 쓰지 않는다.
  찾을 수 없으면 소스에 접근성 이름(`aria-label`)을 추가하는 쪽을 먼저 검토한다.
- 예외 응답은 테스트 안에서 기본 핸들러를 덮어쓴다. 경로는 반드시 `ENDPOINTS`로 만든다.

  ```js
  server.use(http.get(apiUrl(ENDPOINTS.POLICY.LIST), () => fail(500), { once: true }));
  ```

- 새 화면이 진입 시 새 API를 부르면 `tests/msw/handlers.js`에 기본 핸들러를 추가한다.
  핸들러가 없는 요청은 `onUnhandledRequest: 'error'`로 테스트가 실패한다.

### E2E

- 사용자 여정 하나당 spec 하나. 예: `tests/e2e/favoritePersist.spec.js`
- 계정은 `support/accounts.js`, 로그인은 `support/actions.js`의 헬퍼를 쓴다.
- 페이지가 lazy 청크라서 URL이 먼저 바뀌고 화면은 늦게 바뀐다. URL 대신 **새 화면에만 있는 요소**를 기다린다.
- D-day처럼 날짜에 따라 바뀌는 문구는 검증하지 않거나 `page.clock`으로 고정한다.

## 앞으로 할 일

1. **커버리지 threshold**: 이번에는 리포트만 낸다. 머지 후 실제 수치를 보고 `src/utils/**`부터 기준을 건다.
2. **실서버 E2E**: 백엔드가 배포되면 같은 spec을 `E2E_BASE_URL`로 실서버에 돌린다.
   `playwright.config.js`에서 `E2E_BASE_URL`이 있으면 `webServer`를 끄고 `baseURL`만 바꾸는 방식으로 넣는다.
   실서버 상태에 따라 PR이 막히면 안 되므로 `workflow_dispatch`(수동)나 야간 스케줄 워크플로로 분리한다.
   가입 여정(E-3)은 실제 DB에 계정이 남으니 고유 이메일 + 테스트 후 탈퇴로 정리한다.
3. **API 계약 확인**: 명세(OpenAPI 등)가 나오면 `tests/msw/fixtures.js`의 응답 모양이 명세와 같은지
   검사하는 테스트를 추가해, 목 기반 테스트가 실제와 어긋나는 것을 막는다.
4. **아직 테스트가 없는 화면**: 마이페이지(조건 수정·탈퇴), 이메일 찾기, 카드뉴스.
   같은 방식(통합 우선, 여정이 길면 E2E)으로 추가한다.
