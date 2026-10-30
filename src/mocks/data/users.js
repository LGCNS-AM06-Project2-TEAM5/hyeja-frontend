/** 목 로그인 계정. 화면 테스트용 비밀번호는 두 계정 모두 같다. */
export const MOCK_PASSWORD = 'hyeja1234!';

export const USERS = [
  {
    id: 1,
    email: 'minji@hyeja.kr',
    password: MOCK_PASSWORD,
    nickname: '민지',
    role: 'USER',
    joinedAt: '2026-09-18',
    profile: {
      birthDate: '1999-03-12',
      sidoCode: '11',
      regionCode: '11440',
      employmentCode: 'UNEMPLOYED',
      houseless: true,
      marriageCode: 'SINGLE',
      incomeRange: '',
      educationCode: 'COLLEGE_GRADUATE',
      housingType: 'MONTHLY_RENT',
    },
  },
  {
    id: 2,
    email: 'admin@hyeja.kr',
    password: MOCK_PASSWORD,
    nickname: '관리자',
    role: 'ADMIN',
    joinedAt: '2026-09-01',
    profile: {
      birthDate: '1995-05-05',
      sidoCode: '11',
      regionCode: '11000',
      employmentCode: 'EMPLOYED',
      houseless: false,
      marriageCode: 'MARRIED',
      incomeRange: 'R4000_5000',
      educationCode: 'COLLEGE_GRADUATE',
      housingType: 'OWNED',
    },
  },
];
