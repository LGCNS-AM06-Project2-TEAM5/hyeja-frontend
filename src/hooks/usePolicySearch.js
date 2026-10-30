import { useCallback, useEffect, useMemo, useState } from 'react';

import * as policyApi from '@/api/policyApi';
import { RECOMMENDATION_GROUP } from '@/constants/policy';
import { useAuth } from '@/hooks/useAuth';
import { getErrorMessage, isCanceledError } from '@/utils/getErrorMessage';
import { searchResultCache } from '@/utils/searchResultCache';

const EMPTY_GROUPS = {
  [RECOMMENDATION_GROUP.POSSIBLE]: [],
  [RECOMMENDATION_GROUP.NEED_CHECK]: [],
  [RECOMMENDATION_GROUP.IMPOSSIBLE]: [],
};

const INITIAL_STATE = {
  groups: EMPTY_GROUPS,
  isLoading: true,
  errorMessage: '',
  isNotHousing: false,
};

const IDLE_STATE = { ...INITIAL_STATE, isLoading: false };

/**
 * 검색은 로그인이 필요하다. 비로그인이거나 검색어가 비어 있으면 요청하지 않고 isIdle로 알린다.
 * historyKey(location.key)를 주면, 뒤로·앞으로 가기로 돌아온 검색은 저장해 둔 결과를 쓴다.
 */
export const usePolicySearch = (params = {}, { historyKey } = {}) => {
  const paramsKey = JSON.stringify(params);
  const { isAuthenticated, isLoading: isAuthLoading, user } = useAuth();
  const memberId = user?.id ?? null;
  const hasQuery = Boolean(params.query?.trim());
  const isIdle = !hasQuery || (!isAuthLoading && !isAuthenticated);
  const canSearch = !isIdle && !isAuthLoading;
  // 같은 검색어라도 방문 기록이나 회원이 다르면 다른 요청이다.
  const requestKey = JSON.stringify([historyKey ?? null, memberId, paramsKey]);
  const [reloadToken, setReloadToken] = useState(0);
  // requestKey는 이 상태가 어느 요청의 결과인지 나타낸다. 다른 요청의 결과를 잠깐이라도 보여 주지 않는다.
  const [state, setState] = useState({ ...INITIAL_STATE, requestKey: null });
  // refetch로 다시 묻기로 한 검색. 저장된 결과가 있어도 쓰지 않는다.
  const [refetchedTarget, setRefetchedTarget] = useState(null);

  const cacheTarget = useMemo(
    () => (historyKey ? { historyKey, memberId, query: JSON.parse(paramsKey).query } : null),
    [historyKey, memberId, paramsKey],
  );

  const cachedResult = useMemo(
    () =>
      canSearch && cacheTarget && cacheTarget !== refetchedTarget
        ? searchResultCache.read(cacheTarget)
        : null,
    [canSearch, cacheTarget, refetchedTarget],
  );

  useEffect(() => {
    if (!canSearch || cachedResult) {
      return undefined;
    }

    let isActive = true;

    const loadSearchResult = async () => {
      try {
        const data = await policyApi.searchPolicies(JSON.parse(paramsKey));
        const result = { groups: { ...EMPTY_GROUPS, ...(data.groups ?? {}) } };

        // 결과를 기다리다 화면을 떠났어도 남겨 둬야, 뒤로·앞으로 가기로 돌아왔을 때 다시 요청하지 않는다.
        if (cacheTarget) {
          searchResultCache.save(cacheTarget, result);
        }

        if (isActive) {
          setState({ ...result, isLoading: false, errorMessage: '', requestKey });
        }
      } catch (error) {
        if (isActive && !isCanceledError(error)) {
          setState({
            ...INITIAL_STATE,
            isLoading: false,
            errorMessage: getErrorMessage(error),
            isNotHousing: policyApi.isNotHousingSearchError(error),
            requestKey,
          });
        }
      }
    };

    loadSearchResult();

    return () => {
      isActive = false;
    };
  }, [paramsKey, requestKey, reloadToken, canSearch, cacheTarget, cachedResult]);

  /** 저장해 둔 결과가 있어도 서버에 다시 묻는다. */
  const refetch = useCallback(() => {
    setRefetchedTarget(cacheTarget);
    setState((previous) => ({
      ...previous,
      isLoading: true,
      errorMessage: '',
      isNotHousing: false,
    }));
    setReloadToken((previous) => previous + 1);
  }, [cacheTarget]);

  const getCurrentState = () => {
    if (isIdle) {
      return IDLE_STATE;
    }

    if (cachedResult) {
      return { ...cachedResult, isLoading: false, errorMessage: '', isNotHousing: false };
    }

    return state.requestKey === requestKey ? state : INITIAL_STATE;
  };

  const { groups, isLoading, errorMessage, isNotHousing } = getCurrentState();
  const groupCounts = Object.entries(groups).reduce(
    (counts, [group, policies]) => ({ ...counts, [group]: policies.length }),
    {},
  );
  const totalCount = Object.values(groupCounts).reduce((sum, count) => sum + count, 0);

  return {
    groups,
    isLoading,
    errorMessage,
    isNotHousing,
    isIdle,
    groupCounts,
    totalCount,
    refetch,
  };
};
