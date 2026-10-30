import {
  EMPLOYMENT_CODES,
  INCOME_RANGE_CODES,
  PROFILE_CODE_GROUPS,
} from '@/constants/profileCodes';

export { EMPLOYMENT_CODES, INCOME_RANGE_CODES };

export const REGION_CODES = [
  {
    sidoCode: '11',
    sidoName: '서울특별시',
    sigungu: [
      { code: '11000', name: '서울 전체' },
      { code: '11440', name: '마포구' },
      { code: '11680', name: '강남구' },
      { code: '11200', name: '성동구' },
      { code: '11305', name: '강북구' },
    ],
  },
  {
    sidoCode: '41',
    sidoName: '경기도',
    sigungu: [
      { code: '41000', name: '경기 전체' },
      { code: '41135', name: '성남시 분당구' },
      { code: '41285', name: '고양시 덕양구' },
      { code: '41110', name: '수원시' },
    ],
  },
  {
    sidoCode: '26',
    sidoName: '부산광역시',
    sigungu: [
      { code: '26000', name: '부산 전체' },
      { code: '26440', name: '강서구' },
      { code: '26230', name: '부산진구' },
    ],
  },
];

export const CODE_GROUPS = { regions: REGION_CODES, ...PROFILE_CODE_GROUPS };
