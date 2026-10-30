import { describe, expect, it } from 'vitest';

import { summarizePolicyRegions } from '@/utils/summarizePolicyRegions';

const SEOUL_SIGUNGU = [
  ['11110', '종로구'],
  ['11140', '중구'],
  ['11170', '용산구'],
  ['11200', '성동구'],
  ['11215', '광진구'],
  ['11230', '동대문구'],
  ['11260', '중랑구'],
  ['11290', '성북구'],
  ['11305', '강북구'],
  ['11320', '도봉구'],
  ['11350', '노원구'],
  ['11380', '은평구'],
  ['11410', '서대문구'],
  ['11440', '마포구'],
  ['11470', '양천구'],
  ['11500', '강서구'],
  ['11530', '구로구'],
  ['11545', '금천구'],
  ['11560', '영등포구'],
  ['11590', '동작구'],
  ['11620', '관악구'],
  ['11650', '서초구'],
  ['11680', '강남구'],
  ['11710', '송파구'],
  ['11740', '강동구'],
];

const seoul = (name) => {
  const [code] = SEOUL_SIGUNGU.find(([, sigunguName]) => sigunguName === name);

  return { region_code: code, region_name: `서울특별시 ${name}` };
};

const ALL_SEOUL = SEOUL_SIGUNGU.map(([, name]) => seoul(name));
const BUNDANG = { region_code: '41135', region_name: '경기도 성남시 분당구' };
const GANGNAM_CODE = '11680';

const summarize = (regions, options = {}) =>
  summarizePolicyRegions({
    regions,
    nationwide: false,
    memberRegionCode: GANGNAM_CODE,
    ...options,
  }).label;

describe('summarizePolicyRegions', () => {
  describe('회원이 서울특별시 강남구에 살 때', () => {
    it('회원 거주지를 포함하면 거주지를 첫 지역으로 둔다', () => {
      expect(summarize([seoul('서초구'), seoul('강남구'), seoul('송파구')])).toBe(
        '서울특별시 강남구 외 2곳',
      );
    });

    it('회원 거주지가 없는 정책은 지역 코드 순서의 첫 지역을 쓴다', () => {
      expect(summarize([seoul('송파구'), seoul('서초구')])).toBe('서울특별시 서초구 외 1곳');
    });

    it('시·도의 시군구를 전부 포함해도 묶지 않고 거주지 기준으로 센다', () => {
      expect(summarize(ALL_SEOUL)).toBe('서울특별시 강남구 외 24곳');
      expect(summarize([...ALL_SEOUL, BUNDANG])).toBe('서울특별시 강남구 외 25곳');
    });

    it('nationwide면 거주지 포함 여부와 관계없이 "전국"으로 보여 준다', () => {
      expect(
        summarizePolicyRegions({
          regions: [],
          nationwide: true,
          memberRegionCode: GANGNAM_CODE,
        }),
      ).toEqual({ label: '전국', regionLabels: [] });
    });
  });

  it('비회원은 지역 코드 순서의 첫 지역을 쓴다', () => {
    expect(
      summarize([seoul('송파구'), seoul('강남구'), seoul('서초구')], { memberRegionCode: null }),
    ).toBe('서울특별시 서초구 외 2곳');
    expect(summarize(ALL_SEOUL, { memberRegionCode: null })).toBe('서울특별시 종로구 외 24곳');
  });

  it('지역이 1개면 그대로 보여 준다', () => {
    expect(summarize([seoul('마포구')])).toBe('서울특별시 마포구');
  });

  it('툴팁용 전체 목록은 지역 이름을 지역 코드 순서로 돌려준다', () => {
    expect(
      summarizePolicyRegions({
        regions: [BUNDANG, seoul('강남구'), seoul('마포구')],
        memberRegionCode: '41135',
      }).regionLabels,
    ).toEqual(['서울특별시 마포구', '서울특별시 강남구', '경기도 성남시 분당구']);
  });

  it('전국 정책이 아닌데 지역이 비어 있으면 빈칸 대신 "전국"으로 보여 준다', () => {
    expect(summarize([])).toBe('전국');
  });

  it('지역 목록이 아예 없어도 "전국"으로 보여 준다', () => {
    expect(summarizePolicyRegions({ nationwide: false })).toEqual({
      label: '전국',
      regionLabels: [],
    });
  });
});
