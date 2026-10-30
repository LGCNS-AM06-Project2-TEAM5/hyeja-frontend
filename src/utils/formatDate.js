import { APPLY_PERIOD_TYPE, DDAY_IMMINENT_THRESHOLD } from '@/constants/policy';

const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;

export const formatDate = (value) => {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? '' : dateFormatter.format(date);
};

export const formatDateRange = (startDate, endDate) => {
  const start = formatDate(startDate);
  const end = formatDate(endDate);

  if (!start && !end) {
    return '상시 모집';
  }

  return `${start} ~ ${end}`;
};

export const getRemainingDays = (endDate) => {
  if (!endDate) {
    return null;
  }

  const target = new Date(endDate);
  if (Number.isNaN(target.getTime())) {
    return null;
  }

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfTarget = new Date(target.getFullYear(), target.getMonth(), target.getDate());

  return Math.round((startOfTarget - startOfToday) / MILLISECONDS_PER_DAY);
};

export const isDeadlineImminent = (policy) => {
  if (policy?.applyPeriodType === APPLY_PERIOD_TYPE.ALWAYS) {
    return false;
  }

  const remainingDays = getRemainingDays(policy?.applyEndDate);

  return remainingDays !== null && remainingDays >= 0 && remainingDays <= DDAY_IMMINENT_THRESHOLD;
};

/** 백엔드가 마감으로 분류했거나, 상시 모집이 아니면서 마감일이 지났는지 본다. */
export const isApplyClosed = (policy) => {
  if (policy?.applyPeriodType === APPLY_PERIOD_TYPE.CLOSED) {
    return true;
  }
  if (policy?.applyPeriodType === APPLY_PERIOD_TYPE.ALWAYS) {
    return false;
  }

  const remainingDays = getRemainingDays(policy?.applyEndDate);

  return remainingDays !== null && remainingDays < 0;
};

export const formatRelativeTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const diffMinutes = Math.floor((Date.now() - date.getTime()) / 60000);

  if (diffMinutes < 1) {
    return '방금 전';
  }
  if (diffMinutes < 60) {
    return `${diffMinutes}분 전`;
  }
  if (diffMinutes < 60 * 24) {
    return `${Math.floor(diffMinutes / 60)}시간 전`;
  }
  if (diffMinutes < 60 * 24 * 7) {
    return `${Math.floor(diffMinutes / (60 * 24))}일 전`;
  }

  return formatDate(value);
};
