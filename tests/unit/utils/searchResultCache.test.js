import { afterEach, describe, expect, it, vi } from 'vitest';

import { RECOMMENDATION_GROUP } from '@/constants/policy';
import { STORAGE_KEYS } from '@/constants/storageKeys';
import { searchResultCache } from '@/utils/searchResultCache';

const SEARCH = { historyKey: 'history-1', memberId: 1, query: '#월세' };
const THIRTY_MINUTES = 30 * 60 * 1000;

const buildResult = (policyIds = ['101']) => ({
  groups: {
    [RECOMMENDATION_GROUP.POSSIBLE]: policyIds.map((id) => ({ id, isFavorite: false })),
    [RECOMMENDATION_GROUP.NEED_CHECK]: [],
    [RECOMMENDATION_GROUP.IMPOSSIBLE]: [],
  },
});

const storageError = () => {
  throw new Error('저장 공간을 쓸 수 없음');
};

// spy는 vitest 설정의 restoreMocks로 테스트마다 원래대로 돌아간다.
describe('searchResultCache', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('같은 방문 기록·회원·검색어로 저장한 결과를 돌려준다', () => {
    const result = buildResult();

    searchResultCache.save(SEARCH, result);

    expect(searchResultCache.read(SEARCH)).toEqual(result);
  });

  it('방문 기록·회원·검색어 중 하나라도 다르면 쓰지 않는다', () => {
    searchResultCache.save(SEARCH, buildResult());

    expect(searchResultCache.read({ ...SEARCH, historyKey: 'history-2' })).toBeNull();
    expect(searchResultCache.read({ ...SEARCH, memberId: 2 })).toBeNull();
    expect(searchResultCache.read({ ...SEARCH, query: '#전세' })).toBeNull();
  });

  it('30분이 지난 결과는 쓰지 않는다', () => {
    vi.useFakeTimers();
    searchResultCache.save(SEARCH, buildResult());

    vi.advanceTimersByTime(THIRTY_MINUTES);
    expect(searchResultCache.read(SEARCH)).not.toBeNull();

    vi.advanceTimersByTime(1);
    expect(searchResultCache.read(SEARCH)).toBeNull();
  });

  it('최근 10개 검색만 남긴다', () => {
    for (let index = 1; index <= 11; index += 1) {
      searchResultCache.save({ ...SEARCH, historyKey: `history-${index}` }, buildResult());
    }

    expect(searchResultCache.read({ ...SEARCH, historyKey: 'history-1' })).toBeNull();
    expect(searchResultCache.read({ ...SEARCH, historyKey: 'history-2' })).not.toBeNull();
    expect(searchResultCache.read({ ...SEARCH, historyKey: 'history-11' })).not.toBeNull();
  });

  it('관심을 바꾸면 저장해 둔 모든 결과에서 그 정책의 하트만 바꾼다', () => {
    searchResultCache.save(SEARCH, buildResult(['101', '102']));
    searchResultCache.save({ ...SEARCH, historyKey: 'history-2' }, buildResult(['101']));

    searchResultCache.updateFavorite(101, true);

    expect(searchResultCache.read(SEARCH).groups[RECOMMENDATION_GROUP.POSSIBLE]).toEqual([
      { id: '101', isFavorite: true },
      { id: '102', isFavorite: false },
    ]);
    expect(
      searchResultCache.read({ ...SEARCH, historyKey: 'history-2' }).groups[
        RECOMMENDATION_GROUP.POSSIBLE
      ],
    ).toEqual([{ id: '101', isFavorite: true }]);
  });

  it('clear하면 저장해 둔 결과를 모두 지운다', () => {
    searchResultCache.save(SEARCH, buildResult());
    searchResultCache.clear();

    expect(searchResultCache.read(SEARCH)).toBeNull();
    expect(sessionStorage.getItem(STORAGE_KEYS.POLICY_SEARCH_CACHE)).toBeNull();
  });

  it('저장값이 깨진 JSON이면 없는 것으로 본다', () => {
    sessionStorage.setItem(STORAGE_KEYS.POLICY_SEARCH_CACHE, '{broken');

    expect(searchResultCache.read(SEARCH)).toBeNull();
  });

  it('저장 공간을 쓸 수 없어도 화면으로 예외를 던지지 않는다', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(storageError);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(storageError);
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(storageError);

    expect(() => searchResultCache.save(SEARCH, buildResult())).not.toThrow();
    expect(searchResultCache.read(SEARCH)).toBeNull();
    expect(() => searchResultCache.clear()).not.toThrow();
  });
});
