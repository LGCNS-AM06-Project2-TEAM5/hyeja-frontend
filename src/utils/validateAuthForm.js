import { VALIDATION_MESSAGES } from '@/constants/messages';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** 설계서 S-03: 8자 이상, 영문과 숫자, 특수문자를 섞어야 한다. */
const STRONG_PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const NICKNAME_MAX_LENGTH = 20;

export const getEmailError = (email) => {
  if (!email) {
    return VALIDATION_MESSAGES.REQUIRED_EMAIL;
  }

  return EMAIL_PATTERN.test(email) ? '' : VALIDATION_MESSAGES.INVALID_EMAIL;
};

export const getPasswordError = (password) => {
  if (!password) {
    return VALIDATION_MESSAGES.REQUIRED_PASSWORD;
  }

  return STRONG_PASSWORD_PATTERN.test(password) ? '' : VALIDATION_MESSAGES.WEAK_PASSWORD;
};

export const getNicknameError = (nickname) => {
  if (!nickname) {
    return VALIDATION_MESSAGES.REQUIRED_NICKNAME;
  }

  return nickname.length > NICKNAME_MAX_LENGTH ? VALIDATION_MESSAGES.LONG_NICKNAME : '';
};

export { NICKNAME_MAX_LENGTH };
