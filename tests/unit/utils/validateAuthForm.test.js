import { describe, expect, it } from 'vitest';

import { VALIDATION_MESSAGES } from '@/constants/messages';
import {
  getEmailError,
  getNicknameError,
  getPasswordError,
  NICKNAME_MAX_LENGTH,
} from '@/utils/validateAuthForm';

describe('getEmailError', () => {
  it('비어 있으면 입력 요청 문구를 준다', () => {
    expect(getEmailError('')).toBe(VALIDATION_MESSAGES.REQUIRED_EMAIL);
  });

  it.each(['minji', 'minji@', 'minji@hyeja', 'min ji@hyeja.kr', '@hyeja.kr'])(
    '형식이 틀린 "%s"는 형식 오류를 준다',
    (email) => {
      expect(getEmailError(email)).toBe(VALIDATION_MESSAGES.INVALID_EMAIL);
    },
  );

  it('올바른 형식이면 빈 문자열을 준다', () => {
    expect(getEmailError('minji@hyeja.kr')).toBe('');
  });
});

describe('getPasswordError', () => {
  it('비어 있으면 입력 요청 문구를 준다', () => {
    expect(getPasswordError('')).toBe(VALIDATION_MESSAGES.REQUIRED_PASSWORD);
  });

  it.each([
    ['7자', 'abc12!x'],
    ['숫자 없음', 'abcdefg!'],
    ['영문 없음', '1234567!'],
    ['특수문자 없음', 'abcd1234'],
  ])('%s이면 강도 부족 문구를 준다', (reason, password) => {
    expect(getPasswordError(password)).toBe(VALIDATION_MESSAGES.WEAK_PASSWORD);
  });

  it('8자 이상에 영문·숫자·특수문자가 모두 있으면 통과한다', () => {
    expect(getPasswordError('abcd123!')).toBe('');
  });
});

describe('getNicknameError', () => {
  it('비어 있으면 입력 요청 문구를 준다', () => {
    expect(getNicknameError('')).toBe(VALIDATION_MESSAGES.REQUIRED_NICKNAME);
  });

  it.each([NICKNAME_MAX_LENGTH - 1, NICKNAME_MAX_LENGTH])('%i자는 통과한다', (length) => {
    expect(getNicknameError('가'.repeat(length))).toBe('');
  });

  it(`${NICKNAME_MAX_LENGTH + 1}자부터는 길이 초과 문구를 준다`, () => {
    expect(getNicknameError('가'.repeat(NICKNAME_MAX_LENGTH + 1))).toBe(
      VALIDATION_MESSAGES.LONG_NICKNAME,
    );
  });
});
