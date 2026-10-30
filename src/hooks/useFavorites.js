import { useCallback, useEffect, useMemo, useState } from 'react';

import * as favoriteApi from '@/api/favoriteApi';
import { useAuth } from '@/hooks/useAuth';
import { getErrorMessage } from '@/utils/getErrorMessage';

/**
 * 관심 정책 화면(S-14)의 목록 한 페이지. params는 { keyword, page }이고 page는 1부터다.
 * 하트 상태 판단에는 쓰지 않는다(useFavoriteToggle).
 */
export const useFavorites = (params = {}) => {
  const { isAuthenticated, user } = useAuth();
  const memberId = user?.id;
  const paramsKey = JSON.stringify(params);
  const [reloadToken, setReloadToken] = useState(0);
  const [state, setState] = useState({
    memberId: null,
    paramsKey: null,
    favorites: [],
    totalCount: 0,
    totalPages: 0,
    isLoading: isAuthenticated,
    errorMessage: '',
  });

  useEffect(() => {
    if (!isAuthenticated || memberId == null) {
      return;
    }

    let isActive = true;

    const loadFavorites = async () => {
      try {
        const data = await favoriteApi.getFavorites(JSON.parse(paramsKey));

        if (isActive) {
          setState({
            memberId,
            paramsKey,
            favorites: data.content ?? [],
            totalCount: data.totalCount ?? 0,
            totalPages: data.totalPages ?? 0,
            isLoading: false,
            errorMessage: '',
          });
        }
      } catch (error) {
        if (isActive) {
          setState({
            memberId,
            paramsKey,
            favorites: [],
            totalCount: 0,
            totalPages: 0,
            isLoading: false,
            errorMessage: getErrorMessage(error),
          });
        }
      }
    };

    loadFavorites();

    return () => {
      isActive = false;
    };
  }, [isAuthenticated, memberId, paramsKey, reloadToken]);

  const isCurrentMember = isAuthenticated && state.memberId === memberId;
  const isCurrentRequest = isCurrentMember && state.paramsKey === paramsKey;

  const favorites = useMemo(
    () => (isCurrentRequest ? state.favorites : []),
    [isCurrentRequest, state.favorites],
  );

  /** 해제한 뒤처럼 화면을 비우지 않고 목록만 다시 받는다. */
  const reload = useCallback(() => setReloadToken((previous) => previous + 1), []);

  const refetch = useCallback(() => {
    setState((previous) => ({ ...previous, isLoading: true, errorMessage: '' }));
    reload();
  }, [reload]);

  return {
    favorites,
    totalCount: isCurrentRequest ? state.totalCount : 0,
    totalPages: isCurrentRequest ? state.totalPages : 0,
    isLoading: isAuthenticated && (!isCurrentRequest || state.isLoading),
    errorMessage: isCurrentRequest ? state.errorMessage : '',
    reload,
    refetch,
  };
};
