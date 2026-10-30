import { useCallback, useEffect, useState } from 'react';

import * as policyApi from '@/api/policyApi';
import { useAuth } from '@/hooks/useAuth';
import { getErrorMessage, isCanceledError } from '@/utils/getErrorMessage';

const INITIAL_LIST_STATE = {
  policies: [],
  totalCount: 0,
  totalPages: 0,
  isLoading: true,
  errorMessage: '',
};

export const usePolicies = (params = {}) => {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const paramsKey = JSON.stringify(params);
  const [reloadToken, setReloadToken] = useState(0);
  const [state, setState] = useState(INITIAL_LIST_STATE);

  useEffect(() => {
    if (isAuthLoading) {
      return undefined;
    }

    let isActive = true;

    const loadPolicies = async () => {
      try {
        const data = await policyApi.getPolicies(JSON.parse(paramsKey), { isAuthenticated });

        if (isActive) {
          setState({
            policies: data.content ?? [],
            totalCount: data.totalCount ?? 0,
            totalPages: data.totalPages ?? 0,
            isLoading: false,
            errorMessage: '',
          });
        }
      } catch (error) {
        if (isActive) {
          setState({
            ...INITIAL_LIST_STATE,
            isLoading: false,
            errorMessage: getErrorMessage(error),
          });
        }
      }
    };

    loadPolicies();

    return () => {
      isActive = false;
    };
  }, [isAuthenticated, isAuthLoading, paramsKey, reloadToken]);

  const refetch = useCallback(() => {
    setState((previous) => ({ ...previous, isLoading: true, errorMessage: '' }));
    setReloadToken((previous) => previous + 1);
  }, []);

  return { ...state, refetch };
};

export const usePolicyDetail = (policyId) => {
  const [reloadToken, setReloadToken] = useState(0);
  const [state, setState] = useState({ policy: null, isLoading: true, errorMessage: '' });

  useEffect(() => {
    if (!policyId) {
      return;
    }

    let isActive = true;

    const loadPolicyDetail = async () => {
      try {
        const data = await policyApi.getPolicyDetail(policyId);

        if (isActive) {
          setState({ policy: data, isLoading: false, errorMessage: '' });
        }
      } catch (error) {
        if (isActive) {
          setState({ policy: null, isLoading: false, errorMessage: getErrorMessage(error) });
        }
      }
    };

    loadPolicyDetail();

    return () => {
      isActive = false;
    };
  }, [policyId, reloadToken]);

  const refetch = useCallback(() => {
    setState((previous) => ({ ...previous, isLoading: true, errorMessage: '' }));
    setReloadToken((previous) => previous + 1);
  }, []);

  return { ...state, refetch };
};

export const useCardNews = () => {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [reloadToken, setReloadToken] = useState(0);
  const [state, setState] = useState({ cardNewsList: [], isLoading: true, errorMessage: '' });

  useEffect(() => {
    if (isAuthLoading) {
      return undefined;
    }

    let isActive = true;
    const controller = new AbortController();

    const loadCardNews = async () => {
      try {
        const cardNewsList = await policyApi.getCardNews({
          isAuthenticated,
          signal: controller.signal,
        });

        if (isActive) {
          setState({ cardNewsList, isLoading: false, errorMessage: '' });
        }
      } catch (error) {
        if (isActive && !isCanceledError(error)) {
          setState({ cardNewsList: [], isLoading: false, errorMessage: getErrorMessage(error) });
        }
      }
    };

    loadCardNews();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [isAuthenticated, isAuthLoading, reloadToken]);

  const refetch = useCallback(() => {
    setState((previous) => ({ ...previous, isLoading: true, errorMessage: '' }));
    setReloadToken((previous) => previous + 1);
  }, []);

  return { ...state, refetch };
};

export const useCardNewsDetail = (policyId) => {
  const [reloadToken, setReloadToken] = useState(0);
  const [state, setState] = useState({
    policyId: null,
    cardNews: null,
    isLoading: false,
    errorMessage: '',
  });

  useEffect(() => {
    if (!policyId) {
      return undefined;
    }

    let isActive = true;
    const controller = new AbortController();

    const loadCardNewsDetail = async () => {
      try {
        const cardNews = await policyApi.getCardNewsDetail(policyId, {
          signal: controller.signal,
        });

        if (isActive) {
          setState({ policyId, cardNews, isLoading: false, errorMessage: '' });
        }
      } catch (error) {
        if (isActive && !isCanceledError(error)) {
          setState({
            policyId,
            cardNews: null,
            isLoading: false,
            errorMessage: getErrorMessage(error),
          });
        }
      }
    };

    loadCardNewsDetail();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [policyId, reloadToken]);

  const refetch = useCallback(() => {
    setState((previous) => ({ ...previous, isLoading: true, errorMessage: '' }));
    setReloadToken((previous) => previous + 1);
  }, []);

  if (!policyId) {
    return { cardNews: null, isLoading: false, errorMessage: '', refetch };
  }

  if (state.policyId !== policyId) {
    return { cardNews: null, isLoading: true, errorMessage: '', refetch };
  }

  return { ...state, refetch };
};
