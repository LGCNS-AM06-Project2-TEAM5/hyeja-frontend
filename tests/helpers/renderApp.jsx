import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';

import App from '@/App';
import theme from '@/styles/theme';
import { tokenStorage } from '@/utils/tokenStorage';

import { TOKENS } from '../msw/fixtures';

/**
 * 실제 앱과 같은 Provider 순서로 화면을 띄운다.
 * <App />을 그대로 쓰고, main.jsx에만 있는 ThemeProvider 한 겹만 더 감싼다.
 * BrowserRouter는 jsdom의 주소를 읽으므로 pushState로 시작 경로를 정한다.
 */
export const renderApp = (route = '/') => {
  window.history.pushState({}, '', route);

  const user = userEvent.setup();

  return {
    user,
    ...render(
      <ThemeProvider theme={theme}>
        <App />
      </ThemeProvider>,
    ),
  };
};

/** 저장된 토큰이 있는 상태로 시작한다. 앱이 뜨면 세션 복구(/me)로 로그인 상태가 된다. */
export const signInAs = (token = TOKENS.MEMBER) => {
  tokenStorage.setTokens({ accessToken: token, refreshToken: 'test-refresh-token' });
};

/**
 * 헤더 안에서만 찾는다. 홈 본문에도 "로그인" 버튼이 있어서 범위를 좁혀야 한다.
 * 첫 화면은 lazy 페이지를 기다리는 동안 Suspense fallback만 보이므로 헤더가 뜰 때까지 기다린다.
 */
export const findHeader = async () =>
  within(await screen.findByRole('banner', undefined, { timeout: 5000 }));
