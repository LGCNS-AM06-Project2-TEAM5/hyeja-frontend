import { useCallback, useEffect, useMemo, useState } from 'react';

import * as authApi from '@/api/authApi';
import * as userApi from '@/api/userApi';
import { AuthContext } from '@/contexts/AuthContext';
import { searchResultCache } from '@/utils/searchResultCache';
import { tokenStorage } from '@/utils/tokenStorage';

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(() => Boolean(tokenStorage.getAccessToken()));

  useEffect(() => {
    if (!tokenStorage.getAccessToken()) {
      return;
    }

    const restoreSession = async () => {
      try {
        const account = await userApi.getMyAccount();
        setUser(account);
      } catch (error) {
        // 서버에 닿지 못한 것뿐이라면 토큰을 지우지 않는다. 인증이 거절된 경우에만 정리한다.
        if (error?.response?.status === 401) {
          tokenStorage.clear();
        }
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  useEffect(() => {
    // 내 조건으로 판정한 검색 결과는 로그인이 끝나면 브라우저에 남기지 않는다.
    const handleUnauthorized = () => {
      searchResultCache.clear();
      setUser(null);
    };

    window.addEventListener('hyeja:unauthorized', handleUnauthorized);

    return () => window.removeEventListener('hyeja:unauthorized', handleUnauthorized);
  }, []);

  const applySession = useCallback(async ({ accessToken, refreshToken, user: sessionUser }) => {
    tokenStorage.setTokens({ accessToken, refreshToken });

    try {
      const authenticatedUser = sessionUser ?? (await userApi.getMyAccount());
      setUser(authenticatedUser);
      return authenticatedUser;
    } catch (error) {
      // 계정을 못 불러오면 로그인 전으로 되돌려, 저장된 토큰과 화면의 로그인 상태가 어긋나지 않게 한다.
      tokenStorage.clear();
      throw error;
    }
  }, []);

  const login = useCallback(
    async (credentials) => {
      const session = await authApi.login(credentials);
      return applySession(session);
    },
    [applySession],
  );

  /** 설계서 F-01: 가입이 끝나면 곧바로 로그인 상태로 조건 등록까지 이어진다. */
  const signup = useCallback(
    async (signupForm) => {
      const session = await authApi.signup(signupForm);
      return applySession(session);
    },
    [applySession],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // 토큰이 이미 만료됐거나 서버에 닿지 않아도, 이 기기의 로그아웃은 그대로 마친다.
    } finally {
      tokenStorage.clear();
      searchResultCache.clear();
      setUser(null);
    }
  }, []);

  const withdraw = useCallback(async (password) => {
    await userApi.deleteAccount(password);
    tokenStorage.clear();
    searchResultCache.clear();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const account = await userApi.getMyAccount();
    setUser(account);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === 'ADMIN',
      isLoading,
      login,
      signup,
      logout,
      withdraw,
      refreshUser,
    }),
    [user, isLoading, login, signup, logout, withdraw, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
