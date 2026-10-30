import { useContext } from 'react';

import { LoginDialogContext } from '@/contexts/LoginDialogContext';

export const useLoginDialog = () => {
  const context = useContext(LoginDialogContext);

  if (!context) {
    throw new Error('useLoginDialog는 LoginDialogProvider 안에서만 사용할 수 있습니다.');
  }

  return context;
};
