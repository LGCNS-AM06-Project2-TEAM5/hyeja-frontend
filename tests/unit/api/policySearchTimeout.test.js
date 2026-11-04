import { afterEach, describe, expect, it, vi } from 'vitest';

import httpClient from '@/api/httpClient';
import { searchPolicies } from '@/api/policyApi';

// MSA에서는 Gateway → recommendation → user·policy·engagement → OpenAI를 거쳐 6~9초가 걸려
// 기본 10초 제한에 자주 걸린다. 검색만 더 길게 기다린다.
describe('searchPolicies 제한 시간', () => {
  afterEach(() => vi.restoreAllMocks());

  it('검색은 기본 10초보다 긴 30초까지 기다린다', async () => {
    const get = vi.spyOn(httpClient, 'get').mockResolvedValue({ data: { result: {} } });
    await searchPolicies({ query: '월세' }).catch(() => {});
    expect(get).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ params: { query: '월세' }, timeout: 30000 }),
    );
  });
});
