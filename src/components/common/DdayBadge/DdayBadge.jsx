import Chip from '@mui/material/Chip';

import AppIcon from '@/components/common/AppIcon';
import { APPLY_PERIOD_TYPE, DDAY_IMMINENT_THRESHOLD } from '@/constants/policy';
import { GRADIENTS, RADIUS, TONES } from '@/styles/theme';
import { getRemainingDays } from '@/utils/formatDate';

/** 설계서 Badge/Dday: 높이 24 · 좌우 9 · 글자 12/16 굵게 */
const BADGE_SX = {
  height: 24,
  borderRadius: `${RADIUS.dday}px`,
  fontWeight: 700,
  '& .MuiChip-label': { paddingInline: '9px' },
  '& .MuiChip-icon': { ml: '7px', mr: '-5px', color: 'inherit' },
};

/** 사흘 안에 끝나는 정책은 임박 중에서도 더 진하게, 종 아이콘을 붙여 보여 준다. */
const URGENT_DAYS = 3;
/** 2주 안에 끝나는 정책은 옅은 하늘색으로 "곧 마감"을 알린다. */
const SOON_DAYS = 14;

/**
 * 남은 기간마다 색을 달리한다.
 * 상시 민트 · D-0~3 진한 보라 그라데이션+종 · D-4~7 보라 · D-8~14 하늘 · 그 뒤 회색 · 마감 회색 테두리
 */
function DdayBadge({ applyPeriodType, applyEndDate, remainingDays: providedRemainingDays }) {
  if (applyPeriodType === APPLY_PERIOD_TYPE.ALWAYS) {
    return (
      <Chip
        label="상시"
        size="small"
        sx={{ ...BADGE_SX, backgroundColor: TONES.mint.bg, color: TONES.mint.fg }}
      />
    );
  }

  const remainingDays =
    providedRemainingDays === undefined ? getRemainingDays(applyEndDate) : providedRemainingDays;

  if (applyPeriodType !== APPLY_PERIOD_TYPE.CLOSED && remainingDays === null) {
    return null;
  }

  if (applyPeriodType === APPLY_PERIOD_TYPE.CLOSED || remainingDays < 0) {
    return (
      <Chip
        label="마감"
        size="small"
        variant="outlined"
        sx={{ ...BADGE_SX, color: 'text.disabled', borderColor: 'divider' }}
      />
    );
  }

  const label = `D-${remainingDays}`;

  if (remainingDays <= URGENT_DAYS) {
    return (
      <Chip
        label={label}
        size="small"
        color="primary"
        icon={<AppIcon name="bell-outline" size={13} />}
        sx={{
          ...BADGE_SX,
          background: GRADIENTS.accent,
          boxShadow: '0 4px 10px rgba(101, 88, 211, 0.35)',
        }}
      />
    );
  }

  if (remainingDays <= DDAY_IMMINENT_THRESHOLD) {
    return <Chip label={label} size="small" color="primary" sx={BADGE_SX} />;
  }

  if (remainingDays <= SOON_DAYS) {
    return (
      <Chip
        label={label}
        size="small"
        sx={{ ...BADGE_SX, backgroundColor: TONES.sky.bg, color: TONES.sky.fg }}
      />
    );
  }

  return (
    <Chip
      label={label}
      size="small"
      sx={{ ...BADGE_SX, backgroundColor: 'grey.200', color: 'text.secondary' }}
    />
  );
}

export default DdayBadge;
