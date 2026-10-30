import { describe, expect, it } from 'vitest';

import { ERROR_MESSAGES } from '@/constants/messages';
import { getErrorMessage, isCanceledError } from '@/utils/getErrorMessage';

/** axios 오류 객체 중 이 함수가 읽는 부분만 만든다. */
const responseError = (status, data = {}) => ({ response: { status, data } });

describe('getErrorMessage', () => {
  it('알려진 API 코드가 없으면 서버가 보낸 message를 쓴다', () => {
    expect(getErrorMessage(responseError(400, { message: '이미 가입된 이메일이에요' }))).toBe(
      '이미 가입된 이메일이에요',
    );
  });

  it.each([
    ['VERIFY_001', '인증 코드가 올바르지 않아요'],
    ['VERIFY_002', '인증 코드가 만료됐어요. 다시 받아 주세요'],
    ['VERIFY_003', '이메일 인증을 먼저 완료해 주세요'],
    ['VERIFY_004', '인증 코드는 60초 후 다시 받을 수 있어요'],
    [
      'VERIFY_005',
      '인증 코드를 5번 틀려 1시간 동안 인증할 수 없어요. 1시간 뒤에 다시 시도해 주세요',
    ],
    ['MEMBER_002', '이미 가입된 이메일이에요'],
    ['MAIL_001', '인증 메일을 보내지 못했어요. 잠시 후 다시 시도해 주세요'],
  ])('알려진 API 코드 %s를 사용자용 문구로 바꾼다', (code, message) => {
    expect(getErrorMessage(responseError(400, { code, message: '서버 원문' }))).toBe(message);
  });

  it('인증 코드가 틀리면 백엔드가 준 남은 시도 횟수를 함께 알려 준다', () => {
    const error = responseError(400, {
      code: 'VERIFY_001',
      message: '서버 원문',
      result: { remainingAttempts: 3 },
    });

    expect(getErrorMessage(error)).toBe('인증 코드가 올바르지 않아요 (남은 기회 3번)');
  });

  it.each([
    [401, ERROR_MESSAGES.UNAUTHORIZED],
    [403, ERROR_MESSAGES.FORBIDDEN],
    [404, ERROR_MESSAGES.NOT_FOUND],
    [500, ERROR_MESSAGES.SERVER],
  ])('message가 없으면 %i 상태에 맞는 문구를 준다', (status, message) => {
    expect(getErrorMessage(responseError(status))).toBe(message);
  });

  it('모르는 상태 코드는 기본 문구를 준다', () => {
    expect(getErrorMessage(responseError(418))).toBe(ERROR_MESSAGES.DEFAULT);
  });

  it.each([
    ['ECONNABORTED', ERROR_MESSAGES.TIMEOUT],
    ['ETIMEDOUT', ERROR_MESSAGES.TIMEOUT],
    ['ERR_NETWORK', ERROR_MESSAGES.NETWORK],
  ])('응답이 없고 코드가 %s이면 그에 맞는 문구를 준다', (code, message) => {
    expect(getErrorMessage({ code })).toBe(message);
  });

  it('응답도 코드도 없으면 네트워크 문구를 준다', () => {
    expect(getErrorMessage(undefined)).toBe(ERROR_MESSAGES.NETWORK);
  });
});

describe('isCanceledError', () => {
  it('요청 취소 오류만 true다', () => {
    expect(isCanceledError({ code: 'ERR_CANCELED' })).toBe(true);
    expect(isCanceledError({ code: 'ERR_NETWORK' })).toBe(false);
    expect(isCanceledError(null)).toBe(false);
  });
});
