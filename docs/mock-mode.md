# 목 모드

백엔드 없이 모든 화면을 실제 흐름대로 확인하는 개발용 모드입니다.
로그인 · 조건 저장 · 맞춤 검색 · 관심 정책 · 알림 · 관리자 수집까지 동작합니다.

## 켜고 끄기

```bash
# .env.development (또는 .env.local)
VITE_API_BASE_URL=http://localhost:8080
VITE_USE_MOCK=true
```

```bash
npm run dev
```

- 배포 빌드는 `.env.production`의 `VITE_USE_MOCK=false`를 씁니다.
  이때 목 코드는 조건부 동적 import라서 **번들에 들어가지 않습니다.**
- 실제 백엔드에 붙일 때는 `VITE_USE_MOCK=false`로 두고 `VITE_API_BASE_URL`을 서버 주소로 바꿉니다.

## 동작 원리

```text
main.jsx ── VITE_USE_MOCK=true ──▶ enableMockApi(httpClient)
                                     ├─ httpClient.defaults.adapter = mockAdapter
                                     └─ window.hyejaMock 등록 (reset · 계정 안내)

httpClient ──▶ mockAdapter ──▶ handlers.js ──▶ mockStore (localStorage: hyejaMockStore)
              250ms 지연        method + 경로로   새로고침해도 유지
              4xx는 axios 에러   핸들러 찾기
```

axios 어댑터만 바꾸므로 화면 · 훅 · api 코드는 실서버일 때와 똑같이 돕니다.

핸들러는 백엔드 응답 모양을 흉내 낸 것이라 **완전한 모사는 아닙니다.**
대부분 `{ isSuccess, code, message, result }` 봉투로 응답하지만, 일부 실패 응답은 `{ message }`만 주고
`후보0건` 검색은 실패 봉투(`POLICY_SEARCH_001`) 대신 빈 결과를 성공으로 줍니다.
에러 코드별 분기는 통합 테스트(`tests/msw`)에서, 실제 응답 계약은 실서버에서 확인합니다.

## 테스트 계정

| 계정             | 비밀번호     | 역할                                              |
| ---------------- | ------------ | ------------------------------------------------- |
| `minji@hyeja.kr` | `hyeja1234!` | 일반 회원 (조건 · 관심 정책 · 알림이 채워져 있음) |
| `admin@hyeja.kr` | `hyeja1234!` | 관리자 (정책 수집 화면 접근)                      |

## 회원가입 이메일 인증

메일은 실제로 보내지 않습니다. 아래 값으로 가입 흐름을 끝까지 확인할 수 있습니다.

| 항목      | 값                                                                              |
| --------- | ------------------------------------------------------------------------------- |
| 인증 코드 | `384021`                                                                        |
| 유효 시간 | 5분                                                                             |
| 잠금      | 5번 틀리면 1시간 동안 발송 · 확인이 막힌다 (`VERIFY_005`). `reset()`으로 풀린다 |

## 특정 화면 확인하기

| 확인할 화면                 | 방법                                                           |
| --------------------------- | -------------------------------------------------------------- |
| 추천 결과 0건               | 검색어에 `후보0건`을 넣는다                                    |
| 주거와 관계없는 검색어 안내 | 검색어에 `주거아님`을 넣는다                                   |
| 해시태그 검색               | `#월세` · `#전세` · `#청약` · `#공공임대`                      |
| 인증 코드 잠금 · 남은 기회  | 회원가입에서 `384021`이 아닌 코드를 넣는다 (5번째에 잠금)      |
| 긴 문자열에서 레이아웃 깨짐 | [`STRING_LENGTH_UI_TEST.md`](../STRING_LENGTH_UI_TEST.md) 참고 |

## 초기화

브라우저 콘솔에서 실행합니다.

```js
window.hyejaMock.reset();
```

목 데이터(인증 잠금 포함) · 로그인 토큰 · 작성 중인 조건 · 저장해 둔 검색 결과를 모두 처음 상태로 돌리고 새로고침합니다.

## 파일 구성

```text
src/mocks
├── index.js          # enableMockApi: 어댑터 교체 · window.hyejaMock 등록
├── mockAdapter.js    # axios 어댑터 규격으로 핸들러 실행
├── handlers.js       # 경로별 목 API (백엔드 응답 모양을 따라 만든다)
├── judge.js          # 화면 확인용 조건 판정 (실제 판정은 백엔드)
├── store.js          # localStorage에 저장하는 목 저장소 · 토큰 발급
└── data              # 정책 · 계정 · 알림 · 용어 · 카드뉴스 더미 데이터
```

- 목과 연결되는 곳(`src/main.jsx`의 조건부 블록, `.env.*`의 `VITE_USE_MOCK`)은 `notice:` 주석으로 표시했습니다.
- `judge.js`는 화면을 확인하기 위한 근사치라 테스트하지 않습니다. 실제 판정 규칙은 백엔드가 가집니다.
- E2E 테스트도 이 목 모드로 빌드한 앱(`dist-e2e`)에서 돕니다. → [`tests/README.md`](../tests/README.md)
