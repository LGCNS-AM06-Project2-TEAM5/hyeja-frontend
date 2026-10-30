import { STORAGE_KEYS } from '@/constants/storageKeys';

const MAX_ENTRY_COUNT = 10;
const MAX_AGE_MS = 30 * 60 * 1000;

/**
 * 추천 검색(F-14)은 요청할 때마다 서버가 OpenAI를 부른다.
 * 뒤로·앞으로 가기로 같은 방문 기록에 돌아오면 다시 요청하지 않고 그때 받은 결과를 쓴다.
 * 방문 기록(location.key)마다 따로 두므로, 새로 검색하면(새 기록) 항상 서버에 다시 묻는다.
 * 탭을 닫으면 사라지도록 sessionStorage에 둔다.
 *
 * search는 { historyKey, memberId, query }다.
 */
const readEntries = () => {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEYS.POLICY_SEARCH_CACHE);

    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const writeEntries = (entries) => {
  try {
    sessionStorage.setItem(STORAGE_KEYS.POLICY_SEARCH_CACHE, JSON.stringify(entries));
  } catch {
    // 저장 공간을 못 쓰는 브라우저에서는 저장 없이 매번 요청한다.
  }
};

const isSameSearch = (entry, search) =>
  entry.historyKey === search.historyKey &&
  entry.memberId === search.memberId &&
  entry.query === search.query;

const isFresh = (entry) => Date.now() - entry.savedAt <= MAX_AGE_MS;

export const searchResultCache = {
  read(search) {
    const entry = readEntries().find((item) => isSameSearch(item, search));

    return entry && isFresh(entry) ? entry.result : null;
  },

  save(search, result) {
    const others = readEntries().filter((item) => !isSameSearch(item, search) && isFresh(item));

    writeEntries([{ ...search, savedAt: Date.now(), result }, ...others].slice(0, MAX_ENTRY_COUNT));
  },

  /** 다른 화면에서 관심을 바꿨으면 저장해 둔 결과의 하트도 맞춘다. 돌아왔을 때 예전 하트가 보이지 않게 한다. */
  updateFavorite(policyId, isFavorite) {
    const entries = readEntries();

    if (entries.length === 0) {
      return;
    }

    writeEntries(
      entries.map((entry) => ({
        ...entry,
        result: {
          ...entry.result,
          groups: Object.fromEntries(
            Object.entries(entry.result.groups).map(([group, policies]) => [
              group,
              policies.map((policy) =>
                String(policy.id) === String(policyId) ? { ...policy, isFavorite } : policy,
              ),
            ]),
          ),
        },
      })),
    );
  },

  clear() {
    try {
      sessionStorage.removeItem(STORAGE_KEYS.POLICY_SEARCH_CACHE);
    } catch {
      // 위와 같다.
    }
  },
};
