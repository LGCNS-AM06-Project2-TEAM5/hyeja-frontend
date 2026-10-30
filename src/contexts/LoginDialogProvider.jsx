import { useCallback, useMemo, useRef, useState } from 'react';

import LoginDialog from '@/components/auth/LoginDialog';
import LoginNoticeDialog from '@/components/auth/LoginNoticeDialog';
import { LOGIN_NOTICE, TOAST_MESSAGES } from '@/constants/messages';
import { LoginDialogContext } from '@/contexts/LoginDialogContext';
import { useToast } from '@/hooks/useToast';

function LoginDialogProvider({ children }) {
  const { showInfo } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [notice, setNotice] = useState(null);
  // 설계서 S-02: 로그인에 성공하면 원래 하려던 동작을 이어서 실행한다.
  const pendingActionRef = useRef(null);

  const openLoginDialog = useCallback((pendingAction) => {
    pendingActionRef.current = pendingAction ?? null;
    setNotice(null);
    setIsOpen(true);
  }, []);

  const closeLoginDialog = useCallback(() => {
    pendingActionRef.current = null;
    setIsOpen(false);
  }, []);

  /** 설계서 S-06: 검색처럼 화면 진입을 막는 기능은 안내 창을 먼저 띄운다. */
  const openLoginNotice = useCallback((options = {}) => {
    const { title, description, pendingAction } = options;

    pendingActionRef.current = pendingAction ?? null;
    setNotice({
      title: title ?? LOGIN_NOTICE.DEFAULT.title,
      description: description ?? LOGIN_NOTICE.DEFAULT.description,
    });
  }, []);

  const closeLoginNotice = useCallback(() => {
    pendingActionRef.current = null;
    setNotice(null);
  }, []);

  /** 안내 창에서 확인을 누르면 하려던 동작을 그대로 들고 로그인 모달로 넘어간다. */
  const confirmLoginNotice = useCallback(() => {
    setNotice(null);
    setIsOpen(true);
  }, []);

  /** 목록의 ♡처럼 화면 안에서 바로 끝나는 기능은 toast와 로그인 모달을 함께 띄운다. */
  const requireLogin = useCallback(
    (pendingAction, message = TOAST_MESSAGES.LOGIN_REQUIRED) => {
      showInfo(message);
      openLoginDialog(pendingAction);
    },
    [openLoginDialog, showInfo],
  );

  const handleLoggedIn = useCallback((authenticatedUser) => {
    const pendingAction = pendingActionRef.current;

    pendingActionRef.current = null;
    setIsOpen(false);
    pendingAction?.(authenticatedUser);
  }, []);

  const value = useMemo(
    () => ({
      isOpen,
      openLoginDialog,
      closeLoginDialog,
      openLoginNotice,
      closeLoginNotice,
      requireLogin,
    }),
    [isOpen, openLoginDialog, closeLoginDialog, openLoginNotice, closeLoginNotice, requireLogin],
  );

  return (
    <LoginDialogContext.Provider value={value}>
      {children}
      <LoginNoticeDialog
        notice={notice}
        onClose={closeLoginNotice}
        onConfirm={confirmLoginNotice}
      />
      <LoginDialog isOpen={isOpen} onClose={closeLoginDialog} onLoggedIn={handleLoggedIn} />
    </LoginDialogContext.Provider>
  );
}

export default LoginDialogProvider;
