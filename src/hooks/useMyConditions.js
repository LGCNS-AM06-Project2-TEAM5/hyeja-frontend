import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import * as userApi from '@/api/userApi';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/hooks/useAuth';
import { getErrorMessage } from '@/utils/getErrorMessage';

const EMPTY_CONDITIONS = [];

/** 홈처럼 조건이 없어도 머물러야 하는 화면은 redirectOnMissingProfile을 끈다. */
export const useMyConditions = ({ redirectOnMissingProfile = true } = {}) => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const memberId = user?.id ?? user?.memberId;
  const [reloadToken, setReloadToken] = useState(0);
  const [state, setState] = useState({
    memberId: null,
    conditions: null,
    summary: '',
    appliedConditions: [],
    isLoading: isAuthenticated,
    errorMessage: '',
  });

  useEffect(() => {
    if (!isAuthenticated || memberId == null) {
      return;
    }

    let isActive = true;

    const loadConditions = async () => {
      try {
        const { conditions, summary, appliedConditions } = await userApi.getMyConditions();

        if (isActive) {
          setState({
            memberId,
            conditions,
            summary,
            appliedConditions,
            isLoading: false,
            errorMessage: '',
          });
        }
      } catch (error) {
        if (redirectOnMissingProfile && error?.response?.data?.code === 'PROFILE_001') {
          navigate(ROUTES.CONDITION_SETUP, { replace: true });
          return;
        }

        if (isActive) {
          setState({
            memberId,
            conditions: null,
            summary: '',
            appliedConditions: [],
            isLoading: false,
            errorMessage: getErrorMessage(error),
          });
        }
      }
    };

    loadConditions();

    return () => {
      isActive = false;
    };
  }, [isAuthenticated, memberId, navigate, redirectOnMissingProfile, reloadToken]);

  const refetch = useCallback(() => {
    setState((previous) => ({ ...previous, isLoading: true, errorMessage: '' }));
    setReloadToken((previous) => previous + 1);
  }, []);

  const isCurrentMember = isAuthenticated && state.memberId === memberId;

  return {
    conditions: isCurrentMember ? state.conditions : null,
    summary: isCurrentMember ? state.summary : '',
    appliedConditions: isCurrentMember ? state.appliedConditions : EMPTY_CONDITIONS,
    isLoading: isAuthenticated && (!isCurrentMember || state.isLoading),
    errorMessage: isCurrentMember ? state.errorMessage : '',
    refetch,
  };
};
