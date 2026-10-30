import { useEffect, useState } from 'react';

import * as policyApi from '@/api/policyApi';

/** F-13: 어려운 말에 쉬운 설명을 붙이려고 용어 사전을 받아온다. */
export const useTerms = () => {
  const [terms, setTerms] = useState([]);

  useEffect(() => {
    let isActive = true;
    const controller = new AbortController();

    const loadTerms = async () => {
      try {
        const termList = await policyApi.getTerms({ signal: controller.signal });

        if (isActive) {
          setTerms(termList);
        }
      } catch {
        // 용어 풀이는 보조 정보라, 실패하면 본문만 그대로 보여준다.
      }
    };

    loadTerms();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, []);

  return terms;
};
