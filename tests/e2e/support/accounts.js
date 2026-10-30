/**
 * notice: E2E는 목 모드 빌드라서 로그인 계정도 앱에 내장된 목 계정(src/mocks/data/users.js)을 쓴다.
 *         계정 값을 테스트에 하드코딩하지 않고 목 데이터에서 가져와, 목 계정이 바뀌어도 함께 따라간다.
 * notice: 실서버 E2E로 돌릴 때는 이 파일만 환경 변수(E2E_MEMBER_EMAIL 등)로 계정을 읽도록 바꾼다.
 */
import { MOCK_PASSWORD, USERS } from '../../../src/mocks/data/users.js';

const findAccount = (role) => {
  const user = USERS.find((item) => item.role === role);

  return { email: user.email, password: MOCK_PASSWORD, nickname: user.nickname };
};

export const MEMBER = findAccount('USER');
export const ADMIN = findAccount('ADMIN');
