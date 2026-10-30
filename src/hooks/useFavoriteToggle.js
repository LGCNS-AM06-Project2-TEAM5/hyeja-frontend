import { useCallback, useState } from 'react';

import * as favoriteApi from '@/api/favoriteApi';
import { TOAST_MESSAGES } from '@/constants/messages';
import { useAuth } from '@/hooks/useAuth';
import { useLoginDialog } from '@/hooks/useLoginDialog';
import { useToast } from '@/hooks/useToast';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { searchResultCache } from '@/utils/searchResultCache';

const FAVORITE_ALREADY_SAVED_CODE = 'FAVORITE_001';
const FAVORITE_NOT_SAVED_CODE = 'FAVORITE_002';

const hasErrorCode = (error, code) => error?.response?.data?.code === code;

/**
 * 하트는 각 API 응답의 isFavorite를 기준으로 보여 주고, 이 화면에서 누른 결과만 그 위에 덮어쓴다.
 * 관심 목록 첫 페이지(8건)로 판단하면 그 밖에 있는 관심 정책이 빈 하트로 보이고,
 * 다시 누를 때 중복 저장(409)이 나기 때문이다.
 */
export const useFavoriteToggle = () => {
  const { isAuthenticated, user } = useAuth();
  const memberId = user?.id ?? null;
  const { requireLogin } = useLoginDialog();
  const { showSuccess, showError } = useToast();
  const [overrides, setOverrides] = useState({ memberId, savedByPolicyId: {} });

  // 로그인한 회원이 바뀌면 이전 회원이 누른 결과를 버린다.
  if (overrides.memberId !== memberId) {
    setOverrides({ memberId, savedByPolicyId: {} });
  }

  const applySaved = useCallback((policyId, isSaved) => {
    searchResultCache.updateFavorite(policyId, isSaved);
    setOverrides((previous) => ({
      ...previous,
      savedByPolicyId: { ...previous.savedByPolicyId, [String(policyId)]: isSaved },
    }));
  }, []);

  /** serverValue는 화면이 받은 응답의 isFavorite 값이다. */
  const isFavorite = useCallback(
    (policyId, serverValue = false) =>
      isAuthenticated && (overrides.savedByPolicyId[String(policyId)] ?? Boolean(serverValue)),
    [isAuthenticated, overrides.savedByPolicyId],
  );

  const saveFavorite = useCallback(
    async (policyId) => {
      try {
        await favoriteApi.addFavorite(policyId);
      } catch (error) {
        // 이미 저장된 정책이면 사용자가 원한 상태이므로 저장된 것으로 맞춘다.
        if (!hasErrorCode(error, FAVORITE_ALREADY_SAVED_CODE)) {
          showError(getErrorMessage(error));
          return;
        }
      }

      applySaved(policyId, true);
      showSuccess(TOAST_MESSAGES.FAVORITE_ADDED);
    },
    [applySaved, showError, showSuccess],
  );

  const removeFavorite = useCallback(
    async (policyId) => {
      try {
        await favoriteApi.removeFavorite(policyId);
      } catch (error) {
        // 이미 관심 정책이 아니면 사용자가 원한 상태이므로 해제된 것으로 맞춘다.
        if (!hasErrorCode(error, FAVORITE_NOT_SAVED_CODE)) {
          showError(getErrorMessage(error));
          return;
        }
      }

      applySaved(policyId, false);
      showSuccess(TOAST_MESSAGES.FAVORITE_REMOVED);
    },
    [applySaved, showError, showSuccess],
  );

  /** isSaved는 누르기 전 하트 상태다. 저장돼 있으면 해제하고, 아니면 저장한다. */
  const toggleFavorite = useCallback(
    async (policyId, isSaved) => {
      if (!isAuthenticated) {
        // 설계서 S-01: 비로그인 ♡는 안내 toast와 로그인 모달을 함께 띄우고,
        // 로그인에 성공하면 누르려던 저장을 이어서 실행한다.
        requireLogin(() => saveFavorite(policyId));
        return;
      }

      await (isSaved ? removeFavorite(policyId) : saveFavorite(policyId));
    },
    [isAuthenticated, removeFavorite, requireLogin, saveFavorite],
  );

  return { isFavorite, toggleFavorite };
};
