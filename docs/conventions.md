# 코드 작성 규칙

새 코드를 쓸 때 지키는 규칙입니다. 서식은 Prettier, 문법 검사는 ESLint가 맡고 CI가 둘 다 확인합니다.

## 폴더와 책임

| 폴더              | 책임                                                            | 하지 않는 것              |
| ----------------- | --------------------------------------------------------------- | ------------------------- |
| `pages/`          | URL과 1:1인 화면. 훅에서 받은 상태로 화면을 조립한다            | axios 호출                |
| `components/`     | 여러 화면이 쓰는 UI 조각. 폴더 하나에 `Name.jsx` + `index.js`   | 서버 요청                 |
| `hooks/`          | 데이터 조회 · 재조회 · 취소와 재사용 로직                       | 서버 필드명 다루기        |
| `api/`            | 경로(`endpoints.js`) · 요청 파라미터 · 응답 변환(`toXxx`)       | React 상태                |
| `contexts/`       | 앱 전체가 함께 보는 상태 (로그인 · 알림 · 토스트 · 로그인 모달) | 화면 하나에서만 쓰는 상태 |
| `constants/`      | 라우트 · 메시지 · 선택지 코드 · 저장소 키                       |                           |
| `utils/`          | React와 무관한 순수 함수                                        | 훅 · 컴포넌트             |
| `styles/theme.js` | 색 · radius · 타이포 · 레이아웃 토큰의 단일 소스                |                           |

- import 경로는 `@/` alias를 씁니다. 예: `import { ROUTES } from '@/constants/routes';`
- 화면에 들어갈 문구는 `src/constants/messages.js`에 모읍니다.

## 데이터 조회

- 컴포넌트는 axios를 직접 부르지 않습니다. `pages → hooks → api` 순서로 내려갑니다.
- 조회는 effect 안에서 하고 `isActive` 플래그로 정리합니다. 응답 순서가 꼬여도 늦게 온 응답이 화면을 덮지 않습니다.
  (ESLint `react-hooks/set-state-in-effect` 규칙도 이 형태를 요구합니다.)
- 로그인 여부에 따라 요청이 달라지는 조회는 세션 복원(`isAuthLoading`)이 끝날 때까지 기다립니다.
  새로고침 직후 비회원 목록을 먼저 불러 잠깐 보여 주는 일을 막습니다.

```js
useEffect(() => {
  if (isAuthLoading) {
    return undefined;
  }

  let isActive = true;

  const loadPolicies = async () => {
    try {
      const data = await policyApi.getPolicies(params, { isAuthenticated });

      if (isActive) {
        setState({ policies: data.content, isLoading: false, errorMessage: '' });
      }
    } catch (error) {
      if (isActive) {
        setState({ policies: [], isLoading: false, errorMessage: getErrorMessage(error) });
      }
    }
  };

  loadPolicies();

  return () => {
    isActive = false;
  };
}, [paramsKey, isAuthenticated, isAuthLoading, reloadToken]);
```

- 다시 불러오기는 `reloadToken`을 올리는 `refetch`로 합니다.
- 화면을 떠나면 끊어도 되는 요청(카드뉴스)은 `AbortController`로 취소합니다.

## 스타일

- 색 · radius · 그림자 · 글꼴은 `src/styles/theme.js`의 토큰으로만 씁니다. hex 값을 컴포넌트에 직접 쓰지 않습니다.

  | 토큰        | 값                                                                                    |
  | ----------- | ------------------------------------------------------------------------------------- |
  | primary     | `#6558d3` (버튼 · 활성 탭 · 링크 · 포커스 등 화면의 5%만)                             |
  | brandDeep   | `#231d45` (랜딩 하단 배너 · 푸터)                                                     |
  | text        | primary `#27213f` · secondary `#686477` · disabled `#8a9099`                          |
  | 상태        | success `#00A845` · warning `#A38F20` · error `#FF1C1C`                               |
  | favorite    | `#e05263` (채워진 하트)                                                               |
  | `TONES`     | violet · sky · mint · peach · rose 파스텔 보조색. 주거 유형 색은 `getSubtypeTone`으로 |
  | `GRADIENTS` | `accent`(보라 버튼 면) · `hero`(화면 머리 영역) · `navy`(어두운 면)                   |
  | `SHADOWS`   | `card` · `soft` · `accent`                                                            |
  | `RADIUS`    | 버튼 · 입력칸 10 · D-day · 칩 99(알약형) · 카드 20 · 토스트 12                        |
  | 글꼴        | `Noto Sans KR` (바꿀 때는 `theme.js`의 `fontFamily` 한 줄만 수정)                     |

- MUI v9는 `alignItems` 같은 system prop을 컴포넌트 prop으로 받지 않습니다. 전부 `sx`에 넣습니다.
- `Typography`의 보조 글자색은 `sx={{ color: 'text.secondary' }}`로 씁니다.
  `color="text.secondary"`처럼 점 경로를 prop으로 주면 MUI v9에서 경고 없이 무시됩니다.

## 화면 규칙

- **알림은 토스트로 통일합니다.** `useToast`의 `showSuccess` · `showError` · `showInfo`를 씁니다.
  화면 아래 가운데, 3초, ✕로 바로 닫기, 한 번에 1개.
- **조건 판정은 색만으로 구분하지 않습니다.** `JudgeIcon`이 ✓ · ✗ · ? 기호를 함께 그립니다.
- **입력 오류는 테두리 2px과 경고 아이콘 문구를 함께** 표시합니다.
  테두리는 테마가, 아이콘과 문구는 `FieldError`가 맡습니다.
- **로그인이 필요한 동작**은 `useLoginDialog`의 `requireLogin(pendingAction)`으로 막습니다.
  넘긴 `pendingAction`은 로그인에 성공하면 이어서 실행합니다(♡ 저장).
  보호 화면 가드처럼 동작을 넘기지 않으면 로그인 모달만 띄웁니다.

## 아이콘

- 화면 아이콘은 `public/icons/*.svg`에 한 파일씩 두고 `AppIcon`의 `name`으로 씁니다.
- SVG에는 단색 도형만 넣습니다. `AppIcon`이 CSS mask로 그려서 주변 글자색을 따라갑니다.

```jsx
<AppIcon name="heart-outline" size={20} />
```

주요 이름: `search` · `bell-outline` · `account-outline` · `lock-outline` · `heart-outline` / `heart` · `eye` / `eye-off` · `close` · `chevron-down`

- 화면 머리 영역과 빈 상태의 장식 그림은 `public/illustrations/*.svg`에 두고 `Illustration`의 `name`으로 씁니다.
  뜻을 전하지 않는 그림이라 보조기기에는 숨깁니다(`alt=""`, `aria-hidden`).

## 주석

- 필요한 곳에만 "왜"를 적습니다. 설계서 화면 번호(`S-06`)나 기능 번호(`F-14`)를 근거로 남길 수 있습니다.
- 목 데이터 · 가정값처럼 **백엔드가 확정되면 바꿔야 하는 곳**은 `notice:` 주석으로 표시합니다.

## 서식

| 도구     | 설정                                                                            |
| -------- | ------------------------------------------------------------------------------- |
| Prettier | 작은따옴표 · 세미콜론 · trailing comma · 한 줄 100자 · LF (`.prettierrc`)       |
| ESLint   | `@eslint/js` recommended · `react-hooks` · `react-refresh` (`eslint.config.js`) |

```bash
npm run lint          # ESLint
npm run format        # Prettier로 고치기
npm run format:check  # CI와 같은 검사
```
