import { useCallback, useEffect, useState } from 'react';

import * as codeApi from '@/api/codeApi';
import { getErrorMessage } from '@/utils/getErrorMessage';

const EMPTY_CODES = {
  regions: [],
  employments: [],
  marriages: [],
  incomeRanges: [],
  educations: [],
  housingTypes: [],
};

/** F-03: 조건 등록 화면의 선택지를 서버에서 받아온다. */
export const useCodes = () => {
  const [reloadToken, setReloadToken] = useState(0);
  const [state, setState] = useState({ codes: EMPTY_CODES, isLoading: true, errorMessage: '' });

  useEffect(() => {
    let isActive = true;

    const loadCodes = async () => {
      try {
        const data = await codeApi.getCodes();

        if (isActive) {
          setState({ codes: { ...EMPTY_CODES, ...data }, isLoading: false, errorMessage: '' });
        }
      } catch (error) {
        if (isActive) {
          setState({
            codes: EMPTY_CODES,
            isLoading: false,
            errorMessage: getErrorMessage(error),
          });
        }
      }
    };

    loadCodes();

    return () => {
      isActive = false;
    };
  }, [reloadToken]);

  const refetch = useCallback(() => {
    setState((previous) => ({ ...previous, isLoading: true, errorMessage: '' }));
    setReloadToken((previous) => previous + 1);
  }, []);

  return { ...state, refetch };
};
