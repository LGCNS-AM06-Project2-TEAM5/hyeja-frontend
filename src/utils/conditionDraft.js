import { STORAGE_KEYS } from '@/constants/storageKeys';

/**
 * 설계서 S-04: 조건 등록 중 이탈하면 입력값을 브라우저에만 임시 저장하고 다음에 이어서 작성한다.
 */
export const conditionDraft = {
  read() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CONDITION_DRAFT);

      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  },

  save(form) {
    try {
      localStorage.setItem(STORAGE_KEYS.CONDITION_DRAFT, JSON.stringify(form));
    } catch {
      // 저장 공간을 못 쓰는 브라우저에서는 임시 저장만 건너뛴다.
    }
  },

  clear() {
    try {
      localStorage.removeItem(STORAGE_KEYS.CONDITION_DRAFT);
    } catch {
      // 위와 같다.
    }
  },
};
