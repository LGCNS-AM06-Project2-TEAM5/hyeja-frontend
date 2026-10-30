import { createElement } from 'react';
import { createTheme } from '@mui/material/styles';

import AppIcon from '@/components/common/AppIcon';

const svgIcon = (name, size = 20) => createElement(AppIcon, { name, size });
const SelectChevron = (props) =>
  createElement(AppIcon, { ...props, name: 'chevron-down', size: 24 });
const PagePrevious = (props) =>
  createElement(AppIcon, { ...props, name: 'chevron-left', size: 20 });
const PageNext = (props) => createElement(AppIcon, { ...props, name: 'chevron-right', size: 20 });
const PageFirst = (props) => createElement(AppIcon, { ...props, name: 'first-page', size: 20 });
const PageLast = (props) => createElement(AppIcon, { ...props, name: 'last-page', size: 20 });
const AlertClose = (props) => createElement(AppIcon, { ...props, name: 'close', size: 20 });

/**
 * 브랜드 색은 퍼플(2026-09-29 확정 개선안). 퍼플은 버튼·활성 탭·링크·포커스·핵심 문구에만 쓰고,
 * 화면은 흰색·옅은 라벤더 80% / 글자·선 15% / 퍼플 5% 비율을 지킨다.
 * 예전 하늘색은 정보 안내(info)용 보조색으로만 남긴다.
 */
const designTokens = {
  accent: '#6558d3',
  accentDark: '#5648c8',
  accentSoft: '#efedff',
  // 그라데이션 밝은 끝 · 옅은 라벤더 바탕 · 옅은 보라 테두리
  accentLight: '#786cff',
  accentTint: '#f7f6fc',
  accentLine: 'rgba(101, 88, 211, 0.14)',
  accentInk: '#ffffff',
  brandDeep: '#231d45',
  brandDeepText2: '#c9c5df',
  brandDeepLine: 'rgba(255, 255, 255, 0.14)',
  info: '#5cb8ff',
  text: '#27213f',
  text2: '#686477',
  text3: '#8a9099',
  canvas: '#ffffff',
  canvasTint: '#fcfbff',
  fill: '#e3e6ea',
  fill2: '#f7f6fc',
  line: '#e5e1f0',
  line2: '#c9c3dd',
  stateOk: '#00A845',
  stateWarn: '#A38F20',
  stateErr: '#FF1C1C',
  favorite: '#e05263',
  // 조건 판정: 파스텔 채움 위에 같은 계열 짙은 기호(대비 4.5 이상). 미충족은 관심 하트와 겹치지 않게 코랄 쪽이다.
  judgeMetFill: '#cffcec',
  judgeMetGlyph: '#04715a',
  judgeMetBorder: '#87cfb8',
  judgeNeedCheckFill: '#fff4c6',
  judgeNeedCheckGlyph: '#9c6000',
  judgeNeedCheckBorder: '#f2c86c',
  judgeNotMetFill: '#ffe9e5',
  judgeNotMetGlyph: '#9a2a1e',
  judgeNotMetBorder: '#f2a89b',
};

/** 보라 기본색과 어울리는 파스텔 보조색. bg는 옅은 바탕, fg는 그 위에 올리는 글자·아이콘 색이다. */
export const TONES = {
  violet: { bg: '#efedff', fg: '#5648c8' },
  sky: { bg: '#e6f4ff', fg: '#1a6fa3' },
  mint: { bg: '#e5f7ee', fg: '#0f7a45' },
  peach: { bg: '#fff1de', fg: '#9a5412' },
  rose: { bg: '#ffeeee', fg: '#b83232' },
};

/** 주거 하위 유형마다 같은 파스텔 색을 써서 목록·카드·상세에서 한눈에 구분되게 한다. */
const SUBTYPE_TONE = {
  월세: TONES.violet,
  전세: TONES.sky,
  '청약·구입': TONES.mint,
  공공임대: TONES.peach,
  '기타 주거': TONES.rose,
};

/** 판정 결과(충족·확인 필요·미충족)의 바탕·글자 색. palette.judge와 같은 값이고, 키는 JUDGE_RESULT 값이다. */
export const JUDGE_TONE = {
  MET: { bg: designTokens.judgeMetFill, fg: designTokens.judgeMetGlyph },
  NEED_CHECK: { bg: designTokens.judgeNeedCheckFill, fg: designTokens.judgeNeedCheckGlyph },
  NOT_MET: { bg: designTokens.judgeNotMetFill, fg: designTokens.judgeNotMetGlyph },
};

export const getSubtypeTone = (subtypeName) => SUBTYPE_TONE[subtypeName] ?? TONES.violet;

export const GRADIENTS = {
  accent: `linear-gradient(145deg, ${designTokens.accentLight} 0%, #4b39c7 100%)`,
  // 랜딩 첫 화면과 같은 옅은 보라·하늘 바탕. 각 화면의 머리 영역에 쓴다.
  hero: 'radial-gradient(circle at 8% 0%, rgba(255,255,255,0.95) 0, rgba(255,255,255,0) 32%), linear-gradient(135deg, #f5f3ff 0%, #edf4ff 56%, #f7f5ff 100%)',
  navy: 'linear-gradient(135deg, #2b2452 0%, #1b1636 100%)',
};

export const SHADOWS = {
  card: '0 18px 44px rgba(31, 28, 55, 0.08)',
  soft: '0 6px 20px rgba(31, 28, 55, 0.06)',
  accent: '0 10px 24px rgba(101, 88, 211, 0.24)',
};

export const COLORS = designTokens;

const SPACING_UNIT = 8;
const CONTENT_WIDTH = 1120;
const PAGE_GUTTER = { xs: 2, sm: 3, md: 4 };

export const LAYOUT = {
  contentWidth: CONTENT_WIDTH,
  headerHeight: 64,
  pageGutter: PAGE_GUTTER,
  // 헤더·본문·푸터 공통 틀. 좌우 여백을 뺀 안쪽 폭이 설계서 콘텐츠 폭(1120)이 되게 여백만큼 넓힌다.
  containerMaxWidth: Object.fromEntries(
    Object.entries(PAGE_GUTTER).map(([breakpoint, gutter]) => [
      breakpoint,
      CONTENT_WIDTH + gutter * SPACING_UNIT * 2,
    ]),
  ),
  // 설계서 Search/Main(홈·추천 결과 공통 큰 검색창) 폭
  searchBarWidth: 600,
};

export const RADIUS = {
  control: 10,
  dday: 99,
  chip: 99,
  card: 20,
  toast: 12,
};

const fontFamily = "'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif";
const mobileText = '@media (max-width:767.98px)';
/**
 * 콘텐츠 폭이 설계서(1120)보다 좁아지는 구간에서만 제목·버튼 글자를 줄인다.
 * 1168px(1120 + 좌우 여백 24 × 2)부터는 배치가 1440 설계서와 같으므로 글자도 설계서 크기를 쓴다.
 */
const tabletText = '@media (min-width:768px) and (max-width:1167.98px)';

const theme = createTheme({
  cssVariables: true,
  breakpoints: {
    values: { xs: 0, sm: 768, md: 1440, lg: 1920, xl: 2560 },
  },
  palette: {
    primary: {
      main: designTokens.accent,
      light: designTokens.accentSoft,
      dark: designTokens.accentDark,
      contrastText: designTokens.accentInk,
    },
    // 어두운 브랜드 면(랜딩 하단 배너 · 푸터). 그 위에서 읽히는 글자와 선 색을 함께 둔다.
    brandDeep: {
      main: designTokens.brandDeep,
      contrastText: designTokens.canvasTint,
      textSecondary: designTokens.brandDeepText2,
      line: designTokens.brandDeepLine,
    },
    info: { main: designTokens.info },
    success: { main: designTokens.stateOk },
    warning: { main: designTokens.stateWarn },
    error: { main: designTokens.stateErr },
    // 관심(하트)은 채워졌을 때만 빨갛게 보여 준다.
    favorite: { main: designTokens.favorite },
    judge: {
      met: {
        fill: designTokens.judgeMetFill,
        glyph: designTokens.judgeMetGlyph,
        border: designTokens.judgeMetBorder,
      },
      needCheck: {
        fill: designTokens.judgeNeedCheckFill,
        glyph: designTokens.judgeNeedCheckGlyph,
        border: designTokens.judgeNeedCheckBorder,
      },
      notMet: {
        fill: designTokens.judgeNotMetFill,
        glyph: designTokens.judgeNotMetGlyph,
        border: designTokens.judgeNotMetBorder,
      },
    },
    text: {
      primary: designTokens.text,
      secondary: designTokens.text2,
      disabled: designTokens.text3,
    },
    background: { default: designTokens.canvasTint, paper: designTokens.canvas },
    divider: designTokens.line,
    grey: {
      100: designTokens.fill2,
      200: designTokens.fill,
      400: designTokens.line,
      500: designTokens.line2,
      600: designTokens.text3,
    },
  },
  shape: { borderRadius: RADIUS.control },
  typography: {
    fontFamily,
    // 랜딩과 같은 결로, 제목은 두껍고 자간을 좁혀 또렷하게 보여 준다.
    h1: {
      fontSize: 28,
      lineHeight: '38px',
      fontWeight: 800,
      letterSpacing: '-0.035em',
      [mobileText]: { fontSize: 23, lineHeight: '31px' },
      [tabletText]: { fontSize: 26, lineHeight: '35px' },
    },
    h2: {
      fontSize: 20,
      lineHeight: '28px',
      fontWeight: 800,
      letterSpacing: '-0.03em',
      [mobileText]: { fontSize: 18, lineHeight: '26px' },
      [tabletText]: { fontSize: 19, lineHeight: '26px' },
    },
    // 설계서 텍스트 스타일: body/md 15/22 굵게(블록 제목·카드 제목), body/sm 14/20, body/sm-strong 14/20, caption 12/16
    subtitle1: { fontSize: 15, lineHeight: '22px', fontWeight: 700 },
    body1: { fontSize: 14, lineHeight: '20px', fontWeight: 400 },
    body2: { fontSize: 14, lineHeight: '20px', fontWeight: 500 },
    caption: { fontSize: 12, lineHeight: '16px', fontWeight: 400 },
    button: {
      fontSize: 14,
      lineHeight: '20px',
      fontWeight: 700,
      textTransform: 'none',
      [tabletText]: { fontSize: 13 },
    },
  },
  components: {
    // MUI가 기본으로 그리던 조작 아이콘도 public/icons의 SVG를 사용한다.
    MuiSelect: { defaultProps: { IconComponent: SelectChevron } },
    MuiRadio: {
      defaultProps: { icon: svgIcon('radio-unchecked'), checkedIcon: svgIcon('radio-checked') },
    },
    MuiAlert: {
      defaultProps: {
        iconMapping: {
          success: svgIcon('check-circle', 24),
          error: svgIcon('cross-circle', 24),
          warning: svgIcon('warning', 24),
          info: svgIcon('info-circle', 24),
        },
        slots: { closeIcon: AlertClose },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { minHeight: 38, paddingInline: 16, borderRadius: RADIUS.control },
        sizeSmall: { minHeight: 32, paddingInline: 12, fontSize: 13, fontWeight: 700 },
        sizeLarge: { minHeight: 48, paddingInline: 22, fontSize: 15 },
        containedPrimary: {
          '&:hover': { backgroundColor: designTokens.accentDark, boxShadow: SHADOWS.accent },
        },
        // 보조 버튼은 옅은 보라 테두리에 검은 글자다.
        outlined: {
          color: designTokens.text,
          borderColor: 'rgba(101, 88, 211, 0.28)',
          backgroundColor: designTokens.canvas,
          '&:hover': { borderColor: designTokens.accent, backgroundColor: designTokens.accentTint },
        },
        text: {
          color: designTokens.text,
          '&:hover': { backgroundColor: designTokens.accentTint },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: { '&:hover': { backgroundColor: designTokens.accentTint } },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: RADIUS.chip, fontWeight: 500 },
        outlined: { borderColor: designTokens.line2 },
        sizeSmall: { height: 22, fontSize: 12, lineHeight: '16px' },
        labelSmall: { paddingInline: 8 },
      },
      variants: [
        {
          props: { variant: 'outlined', size: 'small' },
          style: { color: designTokens.text2 },
        },
      ],
    },
    MuiLink: {
      styleOverrides: {
        root: { color: designTokens.accent, fontWeight: 500 },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontWeight: 700,
          '&.Mui-selected': { color: designTokens.accent },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: RADIUS.control,
          // 페이지 바탕이 옅은 라벤더라, 입력칸은 흰색으로 띄워 구분한다.
          backgroundColor: designTokens.canvas,
          '&:hover:not(.Mui-focused):not(.Mui-error) .MuiOutlinedInput-notchedOutline': {
            borderColor: designTokens.accentLight,
          },
          // 설계서 공통 규칙 3: 입력 오류는 테두리 2px + 빨강 + 안내 문구로 함께 알린다.
          '&.Mui-error .MuiOutlinedInput-notchedOutline': { borderWidth: 2 },
          // 브라우저 자동완성은 글자 칸에만 파란 바탕을 칠해 아이콘 쪽과 끊겨 보인다. 칸 전체를 옅은 보라로 칠한다.
          '&:has(input:-webkit-autofill)': { backgroundColor: designTokens.accentSoft },
        },
        input: {
          '&:-webkit-autofill': {
            WebkitBoxShadow: `0 0 0 100px ${designTokens.accentSoft} inset`,
            WebkitTextFillColor: designTokens.text,
            caretColor: designTokens.text,
            borderRadius: 0,
          },
        },
        notchedOutline: { borderColor: designTokens.line2 },
      },
    },
    MuiPaginationItem: {
      defaultProps: {
        slots: { previous: PagePrevious, next: PageNext, first: PageFirst, last: PageLast },
      },
      styleOverrides: {
        root: {
          fontWeight: 700,
          borderRadius: RADIUS.control,
          '&.Mui-selected': {
            backgroundColor: designTokens.accentSoft,
            color: designTokens.accent,
            '&:hover': { backgroundColor: designTokens.accentSoft },
          },
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          marginTop: 6,
          borderRadius: 14,
          border: `1px solid ${designTokens.line}`,
          boxShadow: SHADOWS.card,
        },
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: { borderRadius: 16, boxShadow: SHADOWS.card },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { backgroundColor: designTokens.brandDeep, fontSize: 12, borderRadius: 8 },
        arrow: { color: designTokens.brandDeep },
      },
    },
    MuiDialog: {
      // 설계서 Backdrop: 뒤 화면은 blur 20에 옅은 남보라를 깔아 둔다.
      defaultProps: {
        slotProps: {
          backdrop: {
            sx: {
              backdropFilter: 'blur(20px)',
              backgroundColor: 'rgba(35, 29, 69, 0.28)',
            },
          },
        },
      },
      styleOverrides: {
        paper: { borderRadius: RADIUS.card, boxShadow: '0 30px 80px rgba(31, 28, 55, 0.22)' },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: { borderRadius: RADIUS.card },
      },
    },
  },
});

export default theme;
