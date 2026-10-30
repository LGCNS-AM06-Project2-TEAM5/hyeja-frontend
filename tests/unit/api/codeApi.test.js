import { describe, expect, it } from 'vitest';

import { toRegionOptions } from '@/api/codeApi';

describe('toRegionOptions', () => {
  it('시군구 API 응답을 프로필 폼 선택지로 변환한다', () => {
    const response = {
      isSuccess: true,
      code: 'SUCCESS_001',
      message: '시군구 목록 조회에 성공했습니다.',
      result: [
        {
          sidoCode: '11',
          sidoName: '서울특별시',
          sigungu: [{ regionCode: '11440', sigunguName: '마포구' }],
        },
      ],
    };

    expect(toRegionOptions(response)).toEqual([
      {
        sidoCode: '11',
        sidoName: '서울특별시',
        sigungu: [{ code: '11440', name: '마포구' }],
      },
    ]);
  });

  it('목록이 없거나 시군구 값이 잘못된 응답도 안전하게 처리한다', () => {
    expect(toRegionOptions({ isSuccess: true, result: null })).toEqual([]);
    expect(
      toRegionOptions({
        result: [{ sidoCode: '11', sidoName: '서울특별시', sigungu: null }],
      }),
    ).toEqual([{ sidoCode: '11', sidoName: '서울특별시', sigungu: [] }]);
  });
});
